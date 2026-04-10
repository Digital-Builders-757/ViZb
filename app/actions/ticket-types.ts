"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import { requireOrgMember } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"

function parseOptionalInt(formData: FormData, key: string): number | null {
  const raw = formData.get(key)
  if (raw == null || String(raw).trim() === "") return null
  const n = Number.parseInt(String(raw).trim(), 10)
  return Number.isFinite(n) ? n : null
}

function parseOptionalIso(formData: FormData, key: string): string | null {
  const raw = formData.get(key)
  if (raw == null || String(raw).trim() === "") return null
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

async function loadEventForOrg(supabase: SupabaseClient, orgId: string, eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("id, org_id, slug")
    .eq("id", eventId)
    .eq("org_id", orgId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

function canEditTickets(role: string) {
  return role === "owner" || role === "admin" || role === "editor"
}

export async function createEventTicketType(formData: FormData) {
  const orgSlug = String(formData.get("org_slug") ?? "").trim()
  const eventId = String(formData.get("event_id") ?? "").trim()
  const eventSlug = String(formData.get("event_slug") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()

  if (!orgSlug || !eventId || !eventSlug) return { error: "Missing event context." }
  if (name.length < 1) return { error: "Name is required." }
  if (name.length > 120) return { error: "Name is too long." }

  const { supabase, org, membership } = await requireOrgMember(orgSlug)
  if (!canEditTickets(membership.role)) {
    return { error: "You don’t have permission to manage ticket types." }
  }

  const ev = await loadEventForOrg(supabase, org.id, eventId)
  if (!ev) return { error: "Event not found." }

  const cap = parseOptionalInt(formData, "capacity")
  if (cap != null && cap < 1) return { error: "Capacity must be at least 1, or leave blank." }

  const salesStartsAt = parseOptionalIso(formData, "sales_starts_at")
  const salesEndsAt = parseOptionalIso(formData, "sales_ends_at")
  if (salesStartsAt && salesEndsAt && salesStartsAt > salesEndsAt) {
    return { error: "Sale start must be before sale end." }
  }

  const { data: maxRow } = await supabase
    .from("ticket_types")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSort = (typeof maxRow?.sort_order === "number" ? maxRow.sort_order : -1) + 1

  const { error } = await supabase.from("ticket_types").insert({
    event_id: eventId,
    name,
    price_cents: 0,
    is_default_rsvp: false,
    sort_order: nextSort,
    capacity: cap,
    sales_starts_at: salesStartsAt,
    sales_ends_at: salesEndsAt,
  })

  if (error) return { error: error.message }

  revalidatePath(`/organizer/${orgSlug}/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}`)
  return { success: true }
}

export async function updateEventTicketType(formData: FormData) {
  const orgSlug = String(formData.get("org_slug") ?? "").trim()
  const eventId = String(formData.get("event_id") ?? "").trim()
  const eventSlug = String(formData.get("event_slug") ?? "").trim()
  const ticketTypeId = String(formData.get("ticket_type_id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()

  if (!orgSlug || !eventId || !eventSlug || !ticketTypeId) return { error: "Missing fields." }
  if (name.length < 1) return { error: "Name is required." }

  const { supabase, org, membership } = await requireOrgMember(orgSlug)
  if (!canEditTickets(membership.role)) {
    return { error: "You don’t have permission to manage ticket types." }
  }

  const ev = await loadEventForOrg(supabase, org.id, eventId)
  if (!ev) return { error: "Event not found." }

  const cap = parseOptionalInt(formData, "capacity")
  if (cap != null && cap < 1) return { error: "Capacity must be at least 1, or leave blank." }

  const salesStartsAt = parseOptionalIso(formData, "sales_starts_at")
  const salesEndsAt = parseOptionalIso(formData, "sales_ends_at")
  if (salesStartsAt && salesEndsAt && salesStartsAt > salesEndsAt) {
    return { error: "Sale start must be before sale end." }
  }

  const sortRaw = formData.get("sort_order")
  let sortOrder: number | undefined
  if (sortRaw != null && String(sortRaw).trim() !== "") {
    const s = Number.parseInt(String(sortRaw).trim(), 10)
    if (!Number.isFinite(s)) return { error: "Sort order must be a number." }
    sortOrder = s
  }

  const { error } = await supabase
    .from("ticket_types")
    .update({
      name,
      capacity: cap,
      sales_starts_at: salesStartsAt,
      sales_ends_at: salesEndsAt,
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    })
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)

  if (error) return { error: error.message }

  revalidatePath(`/organizer/${orgSlug}/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}`)
  return { success: true }
}

export async function deleteEventTicketType(formData: FormData) {
  const orgSlug = String(formData.get("org_slug") ?? "").trim()
  const eventId = String(formData.get("event_id") ?? "").trim()
  const eventSlug = String(formData.get("event_slug") ?? "").trim()
  const ticketTypeId = String(formData.get("ticket_type_id") ?? "").trim()

  if (!orgSlug || !eventId || !eventSlug || !ticketTypeId) return { error: "Missing fields." }

  const { supabase, org, membership } = await requireOrgMember(orgSlug)
  if (!canEditTickets(membership.role)) {
    return { error: "You don’t have permission to manage ticket types." }
  }

  const ev = await loadEventForOrg(supabase, org.id, eventId)
  if (!ev) return { error: "Event not found." }

  const { data: row } = await supabase
    .from("ticket_types")
    .select("id, is_default_rsvp")
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)
    .maybeSingle()

  if (!row) return { error: "Ticket type not found." }
  if (row.is_default_rsvp) return { error: "You can’t delete the default RSVP tier. Rename it instead." }

  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("ticket_type_id", ticketTypeId)

  if ((count ?? 0) > 0) {
    return { error: "This tier has issued tickets and can’t be deleted." }
  }

  const { error } = await supabase.from("ticket_types").delete().eq("id", ticketTypeId).eq("event_id", eventId)

  if (error) return { error: error.message }

  revalidatePath(`/organizer/${orgSlug}/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}`)
  return { success: true }
}
