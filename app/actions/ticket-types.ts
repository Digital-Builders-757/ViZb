"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import { requireOrgMember } from "@/lib/auth-helpers"
import { revalidatePublicEventDiscoveryPaths } from "@/lib/events/revalidate-public-discovery"
import { revalidatePath } from "next/cache"
import { parseEasternDatetimeLocalToIso } from "@/lib/events/eastern-datetime"
import { parseUsdStringToCents } from "@/lib/money/usd"
import {
  DEFAULT_PAID_TIER_NAME,
  MIN_PAID_TICKET_CENTS,
  parsePaidTierPriceUsd,
  validatePaidTierPriceCents,
} from "@/lib/tickets/paid-tier-validation"
import { assertEventOrganizerPayoutReady } from "@/lib/organizer/payout-readiness"

function parseOptionalInt(formData: FormData, key: string): number | null {
  const raw = formData.get(key)
  if (raw == null || String(raw).trim() === "") return null
  const n = Number.parseInt(String(raw).trim(), 10)
  return Number.isFinite(n) ? n : null
}

function parseOptionalIso(formData: FormData, key: string): string | null {
  const raw = formData.get(key)
  if (raw == null || String(raw).trim() === "") return null
  return parseEasternDatetimeLocalToIso(String(raw))
}

async function loadEventForOrg(supabase: SupabaseClient, orgId: string, eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("id, org_id, slug, created_by")
    .eq("id", eventId)
    .eq("org_id", orgId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

function canEditTickets(role: string) {
  return role === "owner" || role === "admin" || role === "editor"
}

function parseIsActive(formData: FormData): boolean {
  const raw = formData.get("is_active")
  if (raw == null) return true
  const s = String(raw).trim().toLowerCase()
  return s === "true" || s === "1" || s === "on"
}

function revalidateTicketPaths(orgSlug: string, eventSlug: string, eventId: string) {
  revalidatePath(`/organizer/${orgSlug}/events/${eventSlug}`)
  revalidatePublicEventDiscoveryPaths(eventSlug)
  revalidatePath(`/admin/events/${eventId}`)
}

async function ensureDefaultRsvpTier(supabase: SupabaseClient, eventId: string) {
  const { data: existing } = await supabase
    .from("ticket_types")
    .select("id")
    .eq("event_id", eventId)
    .eq("is_default_rsvp", true)
    .maybeSingle()

  if (existing) return null

  const { error } = await supabase.from("ticket_types").insert({
    event_id: eventId,
    name: "RSVP",
    price_cents: 0,
    is_default_rsvp: true,
    sort_order: 0,
  })

  return error?.message ?? null
}

async function findPaidTierForEvent(supabase: SupabaseClient, eventId: string) {
  const { data } = await supabase
    .from("ticket_types")
    .select("id, price_cents, is_default_rsvp")
    .eq("event_id", eventId)
    .eq("is_default_rsvp", false)
    .gt("price_cents", 0)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle()

  return data
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

  const priceRaw = String(formData.get("price_usd") ?? "").trim()
  const parsedPrice = parseUsdStringToCents(priceRaw === "" ? "0" : priceRaw)
  if ("error" in parsedPrice) return { error: parsedPrice.error }
  const priceCents = parsedPrice.cents
  if (priceCents < 0) return { error: "Price cannot be negative." }
  if (priceCents > 0) {
    const validated = validatePaidTierPriceCents(priceCents)
    if ("error" in validated) return validated
    const payoutCheck = await assertEventOrganizerPayoutReady(supabase, eventId)
    if ("error" in payoutCheck) return payoutCheck
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
    price_cents: priceCents,
    is_default_rsvp: false,
    sort_order: nextSort,
    capacity: cap,
    quantity_total: cap,
    quantity_sold: 0,
    is_active: true,
    sales_starts_at: salesStartsAt,
    sales_ends_at: salesEndsAt,
    sales_start_at: salesStartsAt,
    sales_end_at: salesEndsAt,
  })

  if (error) return { error: error.message }

  revalidateTicketPaths(orgSlug, eventSlug, eventId)
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

  const { data: existingType, error: loadTypeErr } = await supabase
    .from("ticket_types")
    .select("id, is_default_rsvp, price_cents")
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)
    .maybeSingle()

  if (loadTypeErr || !existingType) {
    return { error: loadTypeErr?.message ?? "Ticket type not found." }
  }

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

  let nextPriceCents: number | undefined
  if (existingType.is_default_rsvp) {
    nextPriceCents = 0
  } else {
    const priceRaw = String(formData.get("price_usd") ?? "").trim()
    const parsedPrice = parseUsdStringToCents(priceRaw === "" ? "0" : priceRaw)
    if ("error" in parsedPrice) return { error: parsedPrice.error }
    nextPriceCents = parsedPrice.cents
    if (nextPriceCents < 0) return { error: "Price cannot be negative." }
    if (nextPriceCents > 0) {
      const validated = validatePaidTierPriceCents(nextPriceCents)
      if ("error" in validated) return validated
      const payoutCheck = await assertEventOrganizerPayoutReady(supabase, eventId)
      if ("error" in payoutCheck) return payoutCheck
    }
  }

  const isActiveRaw = formData.get("is_active")
  const isActive = isActiveRaw != null ? parseIsActive(formData) : undefined

  if (nextPriceCents !== undefined && nextPriceCents !== existingType.price_cents) {
    const { count: issued, error: cntErr } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("ticket_type_id", ticketTypeId)

    if (cntErr) return { error: cntErr.message }
    if ((issued ?? 0) > 0) {
      return { error: "Cannot change price after tickets have been issued for this tier." }
    }
  }

  const { error } = await supabase
    .from("ticket_types")
    .update({
      name,
      price_cents: nextPriceCents ?? existingType.price_cents,
      capacity: cap,
      quantity_total: cap,
      sales_starts_at: salesStartsAt,
      sales_ends_at: salesEndsAt,
      sales_start_at: salesStartsAt,
      sales_end_at: salesEndsAt,
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
      ...(isActive !== undefined ? { is_active: isActive } : {}),
    })
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)

  if (error) return { error: error.message }

  revalidateTicketPaths(orgSlug, eventSlug, eventId)
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

  revalidateTicketPaths(orgSlug, eventSlug, eventId)
  return { success: true }
}

export async function upsertEventPaidTicketTier(formData: FormData) {
  const orgSlug = String(formData.get("org_slug") ?? "").trim()
  const eventId = String(formData.get("event_id") ?? "").trim()
  const eventSlug = String(formData.get("event_slug") ?? "").trim()
  const ticketMode = String(formData.get("ticket_mode") ?? "free_rsvp").trim()

  if (!orgSlug || !eventId || !eventSlug) return { error: "Missing event context." }
  if (ticketMode !== "free_rsvp" && ticketMode !== "paid") {
    return { error: "Invalid ticket mode." }
  }

  const { supabase, org, membership } = await requireOrgMember(orgSlug)
  if (!canEditTickets(membership.role)) {
    return { error: "You don't have permission to manage ticket types." }
  }

  const ev = await loadEventForOrg(supabase, org.id, eventId)
  if (!ev) return { error: "Event not found." }

  const seedErr = await ensureDefaultRsvpTier(supabase, eventId)
  if (seedErr) return { error: seedErr }

  const existingPaid = await findPaidTierForEvent(supabase, eventId)

  if (ticketMode === "free_rsvp") {
    if (existingPaid) {
      const { count } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("ticket_type_id", existingPaid.id)

      if ((count ?? 0) > 0) {
        const { error: deactivateErr } = await supabase
          .from("ticket_types")
          .update({ is_active: false })
          .eq("id", existingPaid.id)
          .eq("event_id", eventId)
        if (deactivateErr) return { error: deactivateErr.message }
      } else {
        const { error: deleteErr } = await supabase
          .from("ticket_types")
          .delete()
          .eq("id", existingPaid.id)
          .eq("event_id", eventId)
        if (deleteErr) return { error: deleteErr.message }
      }
    }

    revalidateTicketPaths(orgSlug, eventSlug, eventId)
    return { success: true }
  }

  const name = String(formData.get("paid_tier_name") ?? DEFAULT_PAID_TIER_NAME).trim()
  if (name.length < 1) return { error: "Tier name is required." }
  if (name.length > 120) return { error: "Tier name is too long." }

  const priceRaw = String(formData.get("price_usd") ?? "").trim()
  const parsedPrice = parsePaidTierPriceUsd(priceRaw)
  if ("error" in parsedPrice) return parsedPrice
  const priceCents = parsedPrice.cents
  if (priceCents < MIN_PAID_TICKET_CENTS) {
    return { error: `Paid ticket price must be at least $${(MIN_PAID_TICKET_CENTS / 100).toFixed(2)}.` }
  }

  const payoutCheck = await assertEventOrganizerPayoutReady(supabase, eventId)
  if ("error" in payoutCheck) return payoutCheck

  const cap = parseOptionalInt(formData, "capacity")
  if (cap != null && cap < 1) return { error: "Quantity must be at least 1, or leave blank." }

  const salesStartsAt = parseOptionalIso(formData, "sales_starts_at")
  const salesEndsAt = parseOptionalIso(formData, "sales_ends_at")
  if (salesStartsAt && salesEndsAt && salesStartsAt > salesEndsAt) {
    return { error: "Sale start must be before sale end." }
  }

  const isActive = parseIsActive(formData)

  const tierPayload = {
    name,
    price_cents: priceCents,
    currency: "usd" as const,
    capacity: cap,
    quantity_total: cap,
    is_active: isActive,
    sales_starts_at: salesStartsAt,
    sales_ends_at: salesEndsAt,
    sales_start_at: salesStartsAt,
    sales_end_at: salesEndsAt,
    is_default_rsvp: false,
  }

  if (existingPaid) {
    if (priceCents !== existingPaid.price_cents) {
      const { count: issued, error: cntErr } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("ticket_type_id", existingPaid.id)

      if (cntErr) return { error: cntErr.message }
      if ((issued ?? 0) > 0) {
        return { error: "Cannot change price after tickets have been issued for this tier." }
      }
    }

    const { error: updateErr } = await supabase
      .from("ticket_types")
      .update(tierPayload)
      .eq("id", existingPaid.id)
      .eq("event_id", eventId)

    if (updateErr) return { error: updateErr.message }
  } else {
    const { error: insertErr } = await supabase.from("ticket_types").insert({
      event_id: eventId,
      ...tierPayload,
      sort_order: 1,
      quantity_sold: 0,
    })

    if (insertErr) return { error: insertErr.message }
  }

  revalidateTicketPaths(orgSlug, eventSlug, eventId)
  return { success: true }
}
