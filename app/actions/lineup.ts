"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeCategories } from "@/lib/events/categories"
import { eventHasOpenMicCategory } from "@/lib/lineup/open-mic"
import {
  isLineupEntryStatus,
  type LineupEntryStatus,
} from "@/lib/lineup/lineup-entry-status"

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

type EventLineupRow = {
  id: string
  org_id: string
  slug: string
  status: string
  categories: unknown
}

async function loadEventForLineup(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ event: EventLineupRow; error?: string }> {
  const { data: event, error } = await supabase
    .from("events")
    .select("id, org_id, slug, status, categories")
    .eq("id", eventId)
    .single()

  if (error || !event) {
    return { event: null as unknown as EventLineupRow, error: "Event not found." }
  }
  return { event: event as EventLineupRow }
}

async function assertCanManageLineup(
  supabase: SupabaseClient,
  userId: string,
  event: EventLineupRow,
): Promise<string | null> {
  if (event.status === "archived") {
    return "Archived events can't be edited."
  }
  const cats = normalizeCategories(event.categories)
  if (!eventHasOpenMicCategory(cats)) {
    return "Lineup is only for open mic events."
  }
  const ok = await isStaffOrHasOrgRole(supabase, userId, event.org_id, [
    "owner",
    "admin",
    "editor",
  ])
  if (!ok) {
    return "You don't have permission to manage this lineup."
  }
  return null
}

function revalidateLineupPaths(opts: {
  orgSlug: string | null
  eventSlug: string
  eventId: string
}) {
  const { orgSlug, eventSlug, eventId } = opts
  if (orgSlug) {
    revalidatePath(`/organizer/${orgSlug}/events/${eventSlug}`)
    revalidatePath(`/organizer/${orgSlug}`)
  }
  revalidatePath(`/admin/events/${eventId}`)
  revalidatePath(`/lineup/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}`)
}

async function fetchEntryWithEvent(
  supabase: SupabaseClient,
  entryId: string,
): Promise<{ entry: { id: string; event_id: string } | null; event: EventLineupRow | null }> {
  const { data: entry, error: e1 } = await supabase
    .from("event_lineup_entries")
    .select("id, event_id")
    .eq("id", entryId)
    .single()
  if (e1 || !entry) {
    return { entry: null, event: null }
  }
  const { data: event, error: e2 } = await supabase
    .from("events")
    .select("id, org_id, slug, status, categories")
    .eq("id", entry.event_id)
    .single()
  if (e2 || !event) {
    return { entry, event: null }
  }
  return { entry, event: event as EventLineupRow }
}

export async function addLineupEntry(formData: FormData) {
  const { user, supabase } = await requireAuth()
  const eventId = String(formData.get("event_id") ?? "").trim()
  const orgSlugParam = String(formData.get("org_slug") ?? "").trim() || null
  const performerName = String(formData.get("performer_name") ?? "").trim()
  const stageName = String(formData.get("stage_name") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null

  if (!eventId) return { error: "Missing event." }
  if (!performerName) return { error: "Performer name is required." }

  const { event, error: loadErr } = await loadEventForLineup(supabase, eventId)
  if (loadErr) return { error: loadErr }

  const deny = await assertCanManageLineup(supabase, user.id, event)
  if (deny) return { error: deny }

  const { data: topRow } = await supabase
    .from("event_lineup_entries")
    .select("slot_order")
    .eq("event_id", eventId)
    .order("slot_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder =
    topRow && typeof (topRow as { slot_order?: number }).slot_order === "number"
      ? (topRow as { slot_order: number }).slot_order + 1
      : 0

  const now = new Date().toISOString()
  const { error: insErr } = await supabase.from("event_lineup_entries").insert({
    event_id: eventId,
    performer_name: performerName,
    stage_name: stageName,
    notes,
    slot_order: nextOrder,
    status: "pending",
    is_public: true,
    created_by: user.id,
    updated_at: now,
  })

  if (insErr) {
    return { error: `Could not add entry: ${insErr.message}` }
  }

  revalidateLineupPaths({
    orgSlug: orgSlugParam,
    eventSlug: event.slug,
    eventId: event.id,
  })
  return { success: true }
}

export async function updateLineupEntry(formData: FormData) {
  const { user, supabase } = await requireAuth()
  const entryId = String(formData.get("entry_id") ?? "").trim()
  const orgSlugParam = String(formData.get("org_slug") ?? "").trim() || null
  const performerName = String(formData.get("performer_name") ?? "").trim()
  const stageNameRaw = formData.get("stage_name")
  const notesRaw = formData.get("notes")
  const slotOrderRaw = formData.get("slot_order")

  if (!entryId) return { error: "Missing entry." }
  if (!performerName) return { error: "Performer name is required." }

  const { entry, event } = await fetchEntryWithEvent(supabase, entryId)
  if (!entry || !event) return { error: "Entry not found." }

  const deny = await assertCanManageLineup(supabase, user.id, event)
  if (deny) return { error: deny }

  const stageName =
    stageNameRaw === null
      ? undefined
      : String(stageNameRaw).trim() || null
  const notes = notesRaw === null ? undefined : String(notesRaw).trim() || null

  let slot_order: number | undefined
  if (slotOrderRaw != null && String(slotOrderRaw).trim() !== "") {
    const n = Number(slotOrderRaw)
    if (!Number.isFinite(n) || n < 0) {
      return { error: "Invalid slot order." }
    }
    slot_order = Math.floor(n)
  }

  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    performer_name: performerName,
    updated_at: now,
  }
  if (stageName !== undefined) patch.stage_name = stageName
  if (notes !== undefined) patch.notes = notes
  if (slot_order !== undefined) patch.slot_order = slot_order

  const { error: upErr } = await supabase
    .from("event_lineup_entries")
    .update(patch)
    .eq("id", entryId)

  if (upErr) {
    return { error: `Could not update entry: ${upErr.message}` }
  }

  revalidateLineupPaths({
    orgSlug: orgSlugParam,
    eventSlug: event.slug,
    eventId: event.id,
  })
  return { success: true }
}

export async function setLineupEntryStatus(formData: FormData) {
  const { user, supabase } = await requireAuth()
  const entryId = String(formData.get("entry_id") ?? "").trim()
  const orgSlugParam = String(formData.get("org_slug") ?? "").trim() || null
  const statusRaw = String(formData.get("status") ?? "").trim() as LineupEntryStatus

  if (!entryId) return { error: "Missing entry." }
  if (!isLineupEntryStatus(statusRaw)) return { error: "Invalid status." }

  const { entry, event } = await fetchEntryWithEvent(supabase, entryId)
  if (!entry || !event) return { error: "Entry not found." }

  const deny = await assertCanManageLineup(supabase, user.id, event)
  if (deny) return { error: deny }

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from("event_lineup_entries")
    .update({ status: statusRaw, updated_at: now })
    .eq("id", entryId)

  if (upErr) {
    return { error: `Could not update status: ${upErr.message}` }
  }

  revalidateLineupPaths({
    orgSlug: orgSlugParam,
    eventSlug: event.slug,
    eventId: event.id,
  })
  return { success: true }
}

export async function setLineupEntryPublic(formData: FormData) {
  const { user, supabase } = await requireAuth()
  const entryId = String(formData.get("entry_id") ?? "").trim()
  const orgSlugParam = String(formData.get("org_slug") ?? "").trim() || null
  const isPublic = String(formData.get("is_public") ?? "") === "true"

  if (!entryId) return { error: "Missing entry." }

  const { entry, event } = await fetchEntryWithEvent(supabase, entryId)
  if (!entry || !event) return { error: "Entry not found." }

  const deny = await assertCanManageLineup(supabase, user.id, event)
  if (deny) return { error: deny }

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from("event_lineup_entries")
    .update({ is_public: isPublic, updated_at: now })
    .eq("id", entryId)

  if (upErr) {
    return { error: `Could not update visibility: ${upErr.message}` }
  }

  revalidateLineupPaths({
    orgSlug: orgSlugParam,
    eventSlug: event.slug,
    eventId: event.id,
  })
  return { success: true }
}

export async function cancelLineupEntry(formData: FormData) {
  const { user, supabase } = await requireAuth()
  const entryId = String(formData.get("entry_id") ?? "").trim()
  const orgSlugParam = String(formData.get("org_slug") ?? "").trim() || null

  if (!entryId) return { error: "Missing entry." }

  const { entry, event } = await fetchEntryWithEvent(supabase, entryId)
  if (!entry || !event) return { error: "Entry not found." }

  const deny = await assertCanManageLineup(supabase, user.id, event)
  if (deny) return { error: deny }

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from("event_lineup_entries")
    .update({ status: "cancelled", is_public: false, updated_at: now })
    .eq("id", entryId)

  if (upErr) {
    return { error: `Could not cancel entry: ${upErr.message}` }
  }

  revalidateLineupPaths({
    orgSlug: orgSlugParam,
    eventSlug: event.slug,
    eventId: event.id,
  })
  return { success: true }
}

export async function moveLineupEntry(formData: FormData) {
  const { user, supabase } = await requireAuth()
  const entryId = String(formData.get("entry_id") ?? "").trim()
  const orgSlugParam = String(formData.get("org_slug") ?? "").trim() || null
  const direction = String(formData.get("direction") ?? "").trim()

  if (!entryId) return { error: "Missing entry." }
  if (direction !== "up" && direction !== "down") {
    return { error: "Invalid direction." }
  }

  const { entry, event } = await fetchEntryWithEvent(supabase, entryId)
  if (!entry || !event) return { error: "Entry not found." }

  const deny = await assertCanManageLineup(supabase, user.id, event)
  if (deny) return { error: deny }

  const { data: rows, error: listErr } = await supabase
    .from("event_lineup_entries")
    .select("id, slot_order")
    .eq("event_id", entry.event_id)
    .order("slot_order", { ascending: true })
    .order("id", { ascending: true })

  if (listErr || !rows?.length) {
    return { error: "Could not load lineup order." }
  }

  const ordered = rows as { id: string; slot_order: number }[]
  const idx = ordered.findIndex((r) => r.id === entryId)
  if (idx < 0) return { error: "Entry not in lineup." }

  const swapWith = direction === "up" ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= ordered.length) {
    return { success: true }
  }

  const reordered = [...ordered]
  const j = swapWith
  ;[reordered[idx], reordered[j]] = [reordered[j], reordered[idx]]
  const now = new Date().toISOString()
  for (let i = 0; i < reordered.length; i++) {
    const { error: up } = await supabase
      .from("event_lineup_entries")
      .update({ slot_order: i, updated_at: now })
      .eq("id", reordered[i].id)
    if (up) return { error: up.message }
  }

  revalidateLineupPaths({
    orgSlug: orgSlugParam,
    eventSlug: event.slug,
    eventId: event.id,
  })
  return { success: true }
}
