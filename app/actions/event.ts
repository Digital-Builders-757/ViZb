"use server"

import { requireAuth, requireAdmin } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { parseCategoriesFromFormData } from "@/lib/events/categories"
import {
  EVENT_FLYER_ALLOWED_MIME_TYPES,
  EVENT_FLYER_INVALID_TYPE_MESSAGE,
  EVENT_FLYER_MAX_BYTES,
  EVENT_FLYER_TOO_LARGE_MESSAGE,
} from "@/lib/events/flyer-upload-constraints"

/** Staff admin or org member with one of the allowed roles (for Server Actions; mirrors RLS intent). */
async function isStaffOrHasOrgRole(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  allowedRoles: readonly string[],
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", userId)
    .single()
  if (profile?.platform_role === "staff_admin") return true
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single()
  return !!(membership && allowedRoles.includes(membership.role))
}

function parseRsvpCapacityField(formData: FormData): { capacity: number | null; error?: string } {
  const raw = formData.get("rsvp_capacity")
  if (raw == null || String(raw).trim() === "") return { capacity: null }
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 1) {
    return { capacity: null, error: "RSVP cap must be a positive whole number, or leave blank for no limit." }
  }
  if (n > 1_000_000) {
    return { capacity: null, error: "RSVP cap is too large." }
  }
  return { capacity: n }
}

export async function createEvent(formData: FormData) {
  const { user, supabase } = await requireAuth()

  const orgId = formData.get("org_id") as string
  const title = (formData.get("title") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()
  const startsAt = formData.get("starts_at") as string
  const endsAt = (formData.get("ends_at") as string) || null
  const venueName = (formData.get("venue_name") as string)?.trim()
  const address = (formData.get("address") as string)?.trim() || null
  const city = (formData.get("city") as string)?.trim()
  const categories = parseCategoriesFromFormData(formData)

  if (!orgId || !title || !startsAt || !venueName || !city) {
    return { error: "Please fill in all required fields." }
  }

  if (!categories) {
    return { error: "Select at least one valid category." }
  }

  const parsedCap = parseRsvpCapacityField(formData)
  if (parsedCap.error) return { error: parsedCap.error }

  const canCreate = await isStaffOrHasOrgRole(supabase, user.id, orgId, ["owner", "admin", "editor"])
  if (!canCreate) {
    return { error: "You don't have permission to create events for this organization." }
  }

  let slug = slugify(title)
  if (!slug) slug = `event-${Date.now()}`

  const { data: existing } = await supabase
    .from("events")
    .select("slug")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }

  const startDate = new Date(startsAt)
  if (Number.isNaN(startDate.getTime())) {
    return { error: "Invalid start date." }
  }

  if (endsAt) {
    const endDate = new Date(endsAt)
    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return { error: "End date must be after start date." }
    }
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      org_id: orgId,
      title,
      slug,
      description: description || null,
      starts_at: startsAt,
      ends_at: endsAt,
      venue_name: venueName,
      address,
      city,
      categories,
      rsvp_capacity: parsedCap.capacity,
      status: "draft" as const,
      created_by: user.id,
    })
    .select("id, slug")
    .single()

  if (error) {
    return { error: `Failed to create event: ${error.message}` }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single()

  const orgSlug = org?.slug || orgId
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath("/dashboard")

  return { success: true, event, orgSlug }
}

export async function uploadEventFlyer(formData: FormData) {
  try {
    const { user, supabase } = await requireAuth()

    const eventId = formData.get("event_id") as string
    const file = formData.get("flyer") as File | null

    if (!eventId || !file) {
      return { error: "Missing event ID or file." }
    }

    if (!(EVENT_FLYER_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return { error: EVENT_FLYER_INVALID_TYPE_MESSAGE }
    }

    if (file.size > EVENT_FLYER_MAX_BYTES) {
      return { error: EVENT_FLYER_TOO_LARGE_MESSAGE }
    }

    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("id, org_id, slug, status, flyer_url")
      .eq("id", eventId)
      .single()

    if (fetchError || !event) {
      return { error: "Event not found." }
    }

    if (!["draft", "pending_review", "rejected"].includes(event.status)) {
      return { error: "Flyers can only be changed on draft, pending, or rejected events." }
    }

    const canUpload = await isStaffOrHasOrgRole(supabase, user.id, event.org_id, ["owner", "admin", "editor"])
    if (!canUpload) {
      return { error: "You don't have permission to upload flyers for this event." }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const storagePath = `${event.org_id}/${event.id}/${Date.now()}.${ext}`

    if (event.flyer_url) {
      const oldPath = event.flyer_url.split("/event-flyers/")[1]
      if (oldPath) {
        await supabase.storage.from("event-flyers").remove([oldPath])
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("event-flyers")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false })

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage
      .from("event-flyers")
      .getPublicUrl(storagePath)

    const flyerUrl = publicUrlData.publicUrl

    const { error: updateError } = await supabase
      .from("events")
      .update({ flyer_url: flyerUrl, updated_at: new Date().toISOString() })
      .eq("id", eventId)

    if (updateError) {
      return { error: `Failed to save flyer URL: ${updateError.message}` }
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", event.org_id)
      .single()

    const orgSlug = org?.slug || event.org_id
    revalidatePath(`/organizer/${orgSlug}`)
    revalidatePath(`/organizer/${orgSlug}/events/${event.slug}`)
    revalidatePath(`/events/${event.slug}`)
    revalidatePath("/events")
    revalidatePath("/dashboard")

    return { success: true, flyerUrl }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err
    }
    return { error: "An unexpected error occurred during upload." }
  }
}

export async function removeEventFlyer(eventId: string) {
  const { user, supabase } = await requireAuth()

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, flyer_url")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  const canRemove = await isStaffOrHasOrgRole(supabase, user.id, event.org_id, ["owner", "admin"])
  if (!canRemove) {
    return { error: "Only owners and admins can remove flyers." }
  }

  if (event.flyer_url) {
    const oldPath = event.flyer_url.split("/event-flyers/")[1]
    if (oldPath) {
      await supabase.storage.from("event-flyers").remove([oldPath])
    }
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ flyer_url: null, updated_at: new Date().toISOString() })
    .eq("id", eventId)

  if (updateError) {
    return { error: `Failed to clear flyer: ${updateError.message}` }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath("/events")
  revalidatePath("/dashboard")

  return { success: true }
}

export async function submitEventForReview(eventId: string) {
  const { user, supabase } = await requireAuth()

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, slug, status, flyer_url")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  if (!["draft", "rejected"].includes(event.status)) {
    return { error: "Only draft or rejected events can be submitted for review." }
  }

  if (!event.flyer_url) {
    return { error: "Please upload a flyer before submitting for review." }
  }

  const canSubmit = await isStaffOrHasOrgRole(supabase, user.id, event.org_id, ["owner", "admin", "editor"])
  if (!canSubmit) {
    return { error: "You don't have permission to submit events for this organization." }
  }

  const now = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from("events")
    .update({
      status: "pending_review",
      updated_at: now,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      published_at: null,
    })
    .eq("id", eventId)
    .in("status", ["draft", "rejected"])
    .select("id")

  if (error) {
    return { error: `Failed to submit: ${error.message}` }
  }

  if (!updated || updated.length === 0) {
    return { error: "Event status has already changed. Please refresh and try again." }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath(`/organizer/${orgSlug}/events/${event.slug}`)
  revalidatePath(`/events/${event.slug}`)
  revalidatePath("/events")
  revalidatePath("/dashboard")

  return { success: true }
}

export async function reviewEvent(formData: FormData) {
  const { user, supabase } = await requireAdmin()

  const eventId = formData.get("eventId") as string
  const action = formData.get("action") as "approve" | "reject"
  const reviewNotes = (formData.get("review_notes") as string)?.trim() || null

  if (!eventId || !["approve", "reject"].includes(action)) {
    return { error: "Invalid review parameters." }
  }

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, slug, status, title")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  if (event.status !== "pending_review") {
    return { error: "Only events pending review can be approved or rejected." }
  }

  const newStatus = action === "approve" ? "published" : "rejected"
  const now = new Date().toISOString()

  const updatePayload: Record<string, string | null> = {
    status: newStatus,
    updated_at: now,
    reviewed_by: user.id,
    reviewed_at: now,
    review_notes: action === "reject" ? reviewNotes : null,
  }

  if (action === "approve") {
    updatePayload.published_at = now
  }

  const { data: updated, error: updateError } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("id", eventId)
    .eq("status", "pending_review")
    .select("id")

  if (updateError) {
    return { error: `Failed to ${action} event: ${updateError.message}` }
  }

  if (!updated || updated.length === 0) {
    return { error: "Event status has already changed. Please refresh and try again." }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath(`/organizer/${orgSlug}/events/${event.slug}`)
  revalidatePath(`/events/${event.slug}`)
  revalidatePath("/events")
  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return {
    success: true,
    action: action === "approve" ? "approved" : "rejected",
    event: { title: event.title, slug: event.slug },
  }
}

// ---------- Update Event Details (Org + Staff) ----------

export async function updateEventDetails(formData: FormData) {
  const { user, supabase } = await requireAuth()

  const eventId = String(formData.get("event_id") ?? "").trim()
  if (!eventId) return { error: "Missing event ID." }

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, slug, status")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  const canEdit = await isStaffOrHasOrgRole(supabase, user.id, event.org_id, ["owner", "admin"])
  if (!canEdit) {
    return { error: "You don't have permission to edit events for this organization." }
  }

  if (event.status === "archived") {
    return { error: "Archived events can't be edited." }
  }

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const startsAt = String(formData.get("starts_at") ?? "").trim()
  const endsAtRaw = String(formData.get("ends_at") ?? "").trim()
  const endsAt = endsAtRaw ? endsAtRaw : null
  const venueName = String(formData.get("venue_name") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim() || null
  const city = String(formData.get("city") ?? "").trim()
  const categories = parseCategoriesFromFormData(formData)

  if (!title || !startsAt || !venueName || !city) {
    return { error: "Please fill in all required fields." }
  }

  if (!categories) {
    return { error: "Select at least one valid category." }
  }

  const parsedCap = parseRsvpCapacityField(formData)
  if (parsedCap.error) return { error: parsedCap.error }

  const startDate = new Date(startsAt)
  if (Number.isNaN(startDate.getTime())) {
    return { error: "Invalid start date." }
  }

  if (endsAt) {
    const endDate = new Date(endsAt)
    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return { error: "End date must be after start date." }
    }
  }

  if (parsedCap.capacity != null) {
    const { count, error: cntErr } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["confirmed", "checked_in"])

    if (cntErr) {
      return { error: `Could not verify RSVP count: ${cntErr.message}` }
    }
    const active = count ?? 0
    if (parsedCap.capacity < active) {
      return {
        error: `RSVP cap must be at least ${active} (current confirmed RSVPs and check-ins).`,
      }
    }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("events")
    .update({
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      venue_name: venueName,
      address,
      city,
      categories,
      rsvp_capacity: parsedCap.capacity,
      updated_at: now,
    })
    .eq("id", eventId)

  if (updateError) {
    return { error: `Failed to update event: ${updateError.message}` }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath(`/organizer/${orgSlug}/events/${event.slug}`)
  revalidatePath(`/events/${event.slug}`)
  revalidatePath("/events")
  revalidatePath("/dashboard")

  return { success: true }
}

// ---------- Archive Event (Admin) ----------

export async function archiveEvent(eventId: string) {
  const { supabase } = await requireAdmin()

  if (!eventId) {
    return { error: "Missing event ID." }
  }

  // Fetch event details for revalidation
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, slug, title, status")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  if (event.status === "archived") {
    return { success: true, title: event.title }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("events")
    .update({ status: "archived", updated_at: now })
    .eq("id", eventId)

  if (updateError) {
    return { error: `Failed to archive event: ${updateError.message}` }
  }

  // Revalidate all relevant pages
  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath(`/events/${event.slug}`)
  revalidatePath("/events")
  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { success: true, title: event.title }
}

export async function unarchiveEvent(eventId: string) {
  const { supabase } = await requireAdmin()

  if (!eventId) {
    return { error: "Missing event ID." }
  }

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, org_id, slug, title, status")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  if (event.status !== "archived") {
    return { success: true, title: event.title }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("events")
    .update({
      status: "draft",
      published_at: null,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      updated_at: now,
    })
    .eq("id", eventId)

  if (updateError) {
    return { error: `Failed to unarchive event: ${updateError.message}` }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath(`/organizer/${orgSlug}/events/${event.slug}`)
  revalidatePath(`/events/${event.slug}`)
  revalidatePath("/events")
  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { success: true, title: event.title }
}

