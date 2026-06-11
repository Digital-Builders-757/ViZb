"use server"

import { requireAuth, requireAdmin, requireOrgMember } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { addMonths, addWeeks } from "date-fns"
import {
  parseCategoriesFromFormData,
  normalizeCategories,
  isValidEventCategory,
} from "@/lib/events/categories"
import { parseRsvpCapacityField } from "@/lib/events/rsvp-capacity"
import {
  EVENT_FLYER_ALLOWED_MIME_TYPES,
  EVENT_FLYER_EMPTY_MESSAGE,
  EVENT_FLYER_INVALID_TYPE_MESSAGE,
  EVENT_FLYER_MAX_BYTES,
  EVENT_FLYER_TOO_LARGE_MESSAGE,
} from "@/lib/events/flyer-upload-constraints"
import { augmentStorageErrorMessage } from "@/lib/supabase/storage-errors"
import { getPlatformOrgSlug } from "@/lib/orgs/platform-org"
import {
  EVENT_KIND_COMMUNITY,
  EVENT_KIND_OFFICIAL,
  isCommunityEvent,
  parseExternalRsvpUrl,
  parseExternalRsvpUrlOptional,
  type EventKind,
} from "@/lib/events/event-kind"
import { revalidatePublicEventDiscoveryPaths } from "@/lib/events/revalidate-public-discovery"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import {
  DEFAULT_PAID_TIER_NAME,
  MIN_PAID_TICKET_CENTS,
  parsePaidTierPriceUsd,
} from "@/lib/tickets/paid-tier-validation"

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

function parseOptionalIntFromForm(formData: FormData, key: string): number | null {
  const raw = formData.get(key)
  if (raw == null || String(raw).trim() === "") return null
  const n = Number.parseInt(String(raw).trim(), 10)
  return Number.isFinite(n) ? n : null
}

function parseOptionalIsoFromForm(formData: FormData, key: string): string | null {
  const raw = formData.get(key)
  if (raw == null || String(raw).trim() === "") return null
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function parseIsActiveFromForm(formData: FormData): boolean {
  const raw = formData.get("is_active")
  if (raw == null) return true
  const s = String(raw).trim().toLowerCase()
  return s === "true" || s === "1" || s === "on"
}

async function seedOfficialEventTicketTiers(
  supabase: SupabaseClient,
  eventId: string,
  formData: FormData,
): Promise<string | null> {
  const ticketMode = String(formData.get("ticket_mode") ?? "free_rsvp").trim()

  const { error: rsvpErr } = await supabase.from("ticket_types").insert({
    event_id: eventId,
    name: "RSVP",
    price_cents: 0,
    is_default_rsvp: true,
    sort_order: 0,
  })
  if (rsvpErr) return rsvpErr.message

  if (ticketMode !== "paid") return null

  const name = String(formData.get("paid_tier_name") ?? DEFAULT_PAID_TIER_NAME).trim()
  if (name.length < 1) return "Tier name is required."
  if (name.length > 120) return "Tier name is too long."

  const priceRaw = String(formData.get("price_usd") ?? "").trim()
  const parsedPrice = parsePaidTierPriceUsd(priceRaw)
  if ("error" in parsedPrice) return parsedPrice.error
  if (parsedPrice.cents < MIN_PAID_TICKET_CENTS) {
    return "Paid ticket price must be at least $0.50."
  }

  const cap = parseOptionalIntFromForm(formData, "capacity")
  if (cap != null && cap < 1) return "Quantity must be at least 1, or leave blank."

  const salesStartsAt = parseOptionalIsoFromForm(formData, "sales_starts_at")
  const salesEndsAt = parseOptionalIsoFromForm(formData, "sales_ends_at")
  if (salesStartsAt && salesEndsAt && salesStartsAt > salesEndsAt) {
    return "Sale start must be before sale end."
  }

  const isActive = parseIsActiveFromForm(formData)

  const { error: paidErr } = await supabase.from("ticket_types").insert({
    event_id: eventId,
    name,
    price_cents: parsedPrice.cents,
    currency: "usd",
    is_default_rsvp: false,
    sort_order: 1,
    capacity: cap,
    quantity_total: cap,
    quantity_sold: 0,
    is_active: isActive,
    sales_starts_at: salesStartsAt,
    sales_ends_at: salesEndsAt,
    sales_start_at: salesStartsAt,
    sales_end_at: salesEndsAt,
  })

  return paidErr?.message ?? null
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
  const categoriesInput = parseCategoriesFromFormData(formData)

  if (!orgId || !title || !startsAt || !venueName || !city) {
    return { error: "Please fill in all required fields." }
  }

  const kindRaw = String(formData.get("event_kind") ?? "").trim()
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle()

  const isStaffAdmin = profile?.platform_role === "staff_admin"
  const platformSlug = getPlatformOrgSlug()
  const { data: platformOrgRow } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", platformSlug)
    .maybeSingle()
  const platformOrgId = platformOrgRow?.id ?? null

  let event_kind: EventKind = EVENT_KIND_OFFICIAL
  if (
    kindRaw === EVENT_KIND_COMMUNITY &&
    isStaffAdmin &&
    platformOrgId !== null &&
    orgId === platformOrgId
  ) {
    event_kind = EVENT_KIND_COMMUNITY
  }

  if (!categoriesInput) {
    return { error: "Select at least one valid category." }
  }
  const categories = categoriesInput

  let rsvp_capacity: number | null = null
  if (event_kind === EVENT_KIND_COMMUNITY) {
    rsvp_capacity = null
  } else {
    const parsedCap = parseRsvpCapacityField(formData)
    if (parsedCap.error) return { error: parsedCap.error }
    rsvp_capacity = parsedCap.capacity
  }

  let external_rsvp_url: string | null = null
  if (event_kind === EVENT_KIND_COMMUNITY) {
    const ext = parseExternalRsvpUrlOptional(formData.get("external_rsvp_url"))
    if (!ext.ok) return { error: ext.error }
    external_rsvp_url = ext.url
  }

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
      rsvp_capacity,
      event_kind,
      external_rsvp_url,
      status: "draft" as const,
      created_by: user.id,
    })
    .select("id, slug")
    .single()

  if (error) {
    return { error: `Failed to create event: ${error.message}` }
  }

  if (event_kind === EVENT_KIND_OFFICIAL) {
    const tierErr = await seedOfficialEventTicketTiers(supabase, event.id, formData)
    if (tierErr) {
      return { error: `Event created but ticketing setup failed: ${tierErr}` }
    }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single()

  const orgSlug = org?.slug || orgId
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath("/dashboard")
  revalidatePath("/admin")
  revalidatePath(`/admin/events/${event.id}`)
  revalidatePublicEventDiscoveryPaths(event.slug)

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

    if (file.size === 0) {
      return { error: EVENT_FLYER_EMPTY_MESSAGE }
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .maybeSingle()

    const isStaffAdmin = profile?.platform_role === "staff_admin"
    const flyerEditableStatuses = ["draft", "pending_review", "rejected"]
    const staffCanReplacePublished = isStaffAdmin && event.status === "published"

    if (!flyerEditableStatuses.includes(event.status) && !staffCanReplacePublished) {
      if (event.status === "archived") {
        return { error: "Flyers cannot be changed on archived events." }
      }
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
      return { error: `Upload failed: ${augmentStorageErrorMessage(uploadError.message)}` }
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
    revalidatePath(`/admin/events/${eventId}`)

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
    .select("id, org_id, slug, status, flyer_url, event_kind, external_rsvp_url")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  if (!["draft", "rejected"].includes(event.status)) {
    return { error: "Only draft or rejected events can be submitted for review." }
  }

  const kind = ((event as { event_kind?: string }).event_kind as EventKind | undefined) ?? EVENT_KIND_OFFICIAL
  if (isCommunityEvent(kind)) {
    const extParsed = parseExternalRsvpUrl((event as { external_rsvp_url?: string | null }).external_rsvp_url)
    if (!extParsed.ok) {
      return { error: extParsed.error }
    }
  } else if (!event.flyer_url) {
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
  revalidatePath(`/admin/events/${eventId}`)

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
    .select("id, org_id, slug, status, title, event_kind, external_rsvp_url")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  if (event.status !== "pending_review") {
    return { error: "Only events pending review can be approved or rejected." }
  }

  const evKind =
    (((event as { event_kind?: string }).event_kind as EventKind | undefined) ?? EVENT_KIND_OFFICIAL)
  if (action === "approve" && isCommunityEvent(evKind)) {
    const extOk = parseExternalRsvpUrl((event as { external_rsvp_url?: string | null }).external_rsvp_url)
    if (!extOk.ok) {
      return { error: extOk.error }
    }
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
  revalidatePublicEventDiscoveryPaths(event.slug)
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
    .select("id, org_id, slug, status, event_kind")
    .eq("id", eventId)
    .single()

  if (fetchError || !event) {
    return { error: "Event not found." }
  }

  const existingKind =
    (((event as { event_kind?: string }).event_kind as EventKind | undefined) ?? EVENT_KIND_OFFICIAL)
  const community = isCommunityEvent(existingKind)

  const canEdit = await isStaffOrHasOrgRole(supabase, user.id, event.org_id, [
    "owner",
    "admin",
    "editor",
  ])
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
  const categoriesRaw = parseCategoriesFromFormData(formData)

  if (!title || !startsAt || !venueName || !city) {
    return { error: "Please fill in all required fields." }
  }

  if (!categoriesRaw) {
    return { error: "Select at least one valid category." }
  }
  const categories = categoriesRaw

  let parsedCap = { capacity: null as number | null, error: null as string | null }
  if (!community) {
    const capResult = parseRsvpCapacityField(formData)
    parsedCap = { capacity: capResult.capacity ?? null, error: capResult.error ?? null }
  }
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

  if (!community && parsedCap.capacity != null) {
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
  const patch: Record<string, unknown> = {
    title,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    venue_name: venueName,
    address,
    city,
    categories,
    updated_at: now,
  }
  patch.rsvp_capacity = community ? null : parsedCap.capacity
  if (community) {
    const extParsed = parseExternalRsvpUrlOptional(formData.get("external_rsvp_url"))
    if (!extParsed.ok) return { error: extParsed.error }
    patch.external_rsvp_url = extParsed.url
  }

  const { error: updateError } = await supabase.from("events").update(patch).eq("id", eventId)

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
  revalidatePath(`/lineup/${event.slug}`)
  revalidatePath("/events")
  revalidatePath(`/admin/events/${eventId}`)
  revalidatePath("/dashboard")

  return { success: true }
}

// ---------- Archive Event (Admin) ----------

function adminEventMutationClient() {
  try {
    return createServiceRoleClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Missing service role configuration."
    throw new Error(msg)
  }
}

export async function archiveEvent(eventId: string) {
  await requireAdmin()

  if (!eventId) {
    return { error: "Missing event ID." }
  }

  let supabase
  try {
    supabase = adminEventMutationClient()
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Missing service role configuration." }
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
  const { data: updated, error: updateError } = await supabase
    .from("events")
    .update({ status: "archived", updated_at: now })
    .eq("id", eventId)
    .select("id")

  if (updateError) {
    return { error: `Failed to archive event: ${updateError.message}` }
  }

  if (!updated || updated.length === 0) {
    return { error: "Failed to archive event. Please refresh and try again." }
  }

  // Revalidate all relevant pages
  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePublicEventDiscoveryPaths(event.slug)
  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { success: true, title: event.title }
}

export async function unarchiveEvent(eventId: string) {
  await requireAdmin()

  if (!eventId) {
    return { error: "Missing event ID." }
  }

  let supabase
  try {
    supabase = adminEventMutationClient()
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Missing service role configuration." }
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
  const { data: updated, error: updateError } = await supabase
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
    .select("id")

  if (updateError) {
    return { error: `Failed to unarchive event: ${updateError.message}` }
  }

  if (!updated || updated.length === 0) {
    return { error: "Failed to unarchive event. Please refresh and try again." }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", event.org_id)
    .single()

  const orgSlug = org?.slug || event.org_id
  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath(`/organizer/${orgSlug}/events/${event.slug}`)
  revalidatePublicEventDiscoveryPaths(event.slug)
  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return { success: true, title: event.title }
}

export type OrganizerDuplicateScheduleShift = "none" | "one_week" | "two_weeks" | "one_month"

function applyDuplicateScheduleShift(
  startsAt: string,
  endsAt: string | null,
  shift: OrganizerDuplicateScheduleShift,
): { starts_at: string; ends_at: string | null } {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime()) || shift === "none") {
    return { starts_at: startsAt, ends_at: endsAt }
  }

  let nextStart = start
  if (shift === "one_week") nextStart = addWeeks(start, 1)
  else if (shift === "two_weeks") nextStart = addWeeks(start, 2)
  else if (shift === "one_month") nextStart = addMonths(start, 1)

  const deltaMs = nextStart.getTime() - start.getTime()
  let nextEndsIso: string | null = endsAt ?? null
  if (endsAt) {
    const end = new Date(endsAt)
    if (!Number.isNaN(end.getTime())) {
      const nextEnd = new Date(end.getTime() + deltaMs)
      if (!Number.isNaN(nextEnd.getTime()) && nextEnd.getTime() > nextStart.getTime()) {
        nextEndsIso = nextEnd.toISOString()
      } else {
        nextEndsIso = null
      }
    }
  }

  return { starts_at: nextStart.toISOString(), ends_at: nextEndsIso }
}

/**
 * Create a draft by copying an existing org event + ticket tiers. Flyer is not copied.
 * Optional schedule shift supports recurring-style workflows without a full recurrence schema.
 */
export async function duplicateOrganizerEventDraft(params: {
  sourceEventId: string
  orgSlug: string
  scheduleShift: OrganizerDuplicateScheduleShift
}) {
  const sourceEventId = params.sourceEventId?.trim()
  const orgSlug = params.orgSlug?.trim()
  if (!sourceEventId || !orgSlug) {
    return { error: "Missing parameters." }
  }

  const { user, supabase, org, membership } = await requireOrgMember(orgSlug)
  if (!["owner", "admin", "editor"].includes(membership.role)) {
    return { error: "You don't have permission to duplicate events for this organization." }
  }

  const { data: src, error: fetchErr } = await supabase
    .from("events")
    .select(
      "id, org_id, title, description, starts_at, ends_at, venue_name, address, city, categories, rsvp_capacity, event_kind, external_rsvp_url",
    )
    .eq("id", sourceEventId)
    .eq("org_id", org.id)
    .single()

  if (fetchErr || !src) {
    return { error: "Event not found." }
  }

  const row = src as {
    title: string
    description: string | null
    starts_at: string
    ends_at: string | null
    venue_name: string
    address: string | null
    city: string
    categories: unknown
    rsvp_capacity: number | null
    event_kind: string | null
    external_rsvp_url: string | null
  }

  const kind: EventKind = isCommunityEvent(row.event_kind ?? undefined) ? EVENT_KIND_COMMUNITY : EVENT_KIND_OFFICIAL
  const times = applyDuplicateScheduleShift(row.starts_at, row.ends_at, params.scheduleShift)
  const startDate = new Date(times.starts_at)
  if (Number.isNaN(startDate.getTime())) {
    return { error: "Invalid start date on source event." }
  }
  if (times.ends_at) {
    const endDate = new Date(times.ends_at)
    if (!Number.isNaN(endDate.getTime()) && endDate <= startDate) {
      return { error: "Shifted dates are invalid — try None or edit after duplicate." }
    }
  }

  const categories = normalizeCategories(row.categories).filter(isValidEventCategory)
  if (categories.length === 0) {
    return { error: "Source event has no valid categories to copy — set categories on the original first." }
  }

  let rsvp_capacity: number | null = row.rsvp_capacity
  let external_rsvp_url = row.external_rsvp_url ?? null
  if (kind === EVENT_KIND_COMMUNITY) {
    rsvp_capacity = null
    const parsed = parseExternalRsvpUrlOptional(external_rsvp_url ?? "")
    if (!parsed.ok && Boolean(external_rsvp_url?.trim())) {
      return { error: "Source listing has an invalid external RSVP URL — fix the original, then duplicate." }
    }
    external_rsvp_url = parsed.ok ? parsed.url : null
  } else {
    external_rsvp_url = null
  }

  const baseTitle = `${row.title.trim()} · Copy`.slice(0, 280)
  let slug = slugify(baseTitle)
  if (!slug) slug = `event-${Date.now()}`

  const { data: clash } = await supabase
    .from("events")
    .select("slug")
    .eq("org_id", org.id)
    .eq("slug", slug)
    .maybeSingle()

  if (clash?.slug) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }

  const { data: created, error: insErr } = await supabase
    .from("events")
    .insert({
      org_id: org.id,
      title: baseTitle || row.title.trim(),
      slug,
      description: row.description ?? null,
      starts_at: times.starts_at,
      ends_at: times.ends_at,
      venue_name: row.venue_name,
      address: row.address,
      city: row.city,
      categories,
      rsvp_capacity,
      event_kind: kind,
      external_rsvp_url,
      flyer_url: null,
      status: "draft" as const,
      created_by: user.id,
      published_at: null,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
    })
    .select("id, slug")
    .single()

  if (insErr || !created?.id || !created?.slug) {
    return { error: insErr ? `Failed to create draft: ${insErr.message}` : "Duplicate failed." }
  }

  const newId = created.id as string
  const newSlug = created.slug as string

  const { data: tiers, error: tierFetchErr } = await supabase
    .from("ticket_types")
    .select("name, price_cents, sort_order, is_default_rsvp, capacity, sales_starts_at, sales_ends_at")
    .eq("event_id", sourceEventId)

  if (!tierFetchErr && tiers?.length) {
    const payloads = tiers.map((t) => {
      const tr = t as {
        name: string
        price_cents: number | null
        sort_order: number | null
        is_default_rsvp: boolean | null
        capacity: number | null
        sales_starts_at: string | null
        sales_ends_at: string | null
      }
      const pc = typeof tr.price_cents === "number" ? tr.price_cents : Number(tr.price_cents ?? 0)
      const so = typeof tr.sort_order === "number" ? tr.sort_order : Number(tr.sort_order ?? 0)
      return {
        event_id: newId,
        name: String(tr.name),
        price_cents: Number.isFinite(pc) ? pc : 0,
        sort_order: Number.isFinite(so) ? so : 0,
        is_default_rsvp: Boolean(tr.is_default_rsvp),
        capacity: typeof tr.capacity === "number" ? tr.capacity : tr.capacity,
        sales_starts_at: tr.sales_starts_at,
        sales_ends_at: tr.sales_ends_at,
      }
    })

    const { error: tierInsErr } = await supabase.from("ticket_types").insert(payloads)
    if (tierInsErr) {
      await supabase.from("events").delete().eq("id", newId)
      return { error: `Could not duplicate ticket tiers: ${tierInsErr.message}` }
    }
  }

  revalidatePath(`/organizer/${orgSlug}`)
  revalidatePath(`/organizer/${orgSlug}/events/${newSlug}`)
  revalidatePath("/admin")

  return { success: true, eventId: newId, slug: newSlug }
}
