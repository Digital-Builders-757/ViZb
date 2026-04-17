"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { mintFreeRsvpTicketForRegistration } from "@/lib/tickets/mint-free-rsvp-ticket"
import { revalidatePath } from "next/cache"

function isRsvpCapacityError(message: string) {
  return (
    message.includes("RSVP capacity is full") ||
    message.includes("capacity is full") ||
    message.includes("Ticket type is full") ||
    message.includes("ticket type is full") ||
    message.includes("This ticket type is full") ||
    message.toLowerCase().includes("check constraint") ||
    message.includes("23514")
  )
}

export async function rsvpToEvent(eventId: string, ticketTypeId?: string | null) {
  const { user, supabase } = await requireAuth()

  if (!eventId) return { error: "Missing event ID." }

  // Idempotency + safety:
  // - If the user is already checked in, do not downgrade them back to confirmed.
  // - If they previously cancelled, confirming should clear cancelled_at.
  const { data: existing, error: existingError } = await supabase
    .from("event_registrations")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingError) {
    return { error: `Failed to RSVP: ${existingError.message}` }
  }

  if (existing?.status === "checked_in" || existing?.status === "confirmed") {
    const { data: regRow } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!regRow?.id) {
      return { error: "Failed to RSVP: registration not found." }
    }

    const minted = await mintFreeRsvpTicketForRegistration(supabase, regRow.id, ticketTypeId ?? null)
    if ("error" in minted) return { error: minted.error }

    revalidatePath("/dashboard/tickets")
    revalidatePath("/tickets")
    revalidatePath("/events")
    return { success: true, ticketId: minted.ticketId }
  }

  const { data: eventMeta, error: metaErr } = await supabase
    .from("events")
    .select("status, rsvp_capacity, slug")
    .eq("id", eventId)
    .maybeSingle()

  if (metaErr || !eventMeta) {
    return { error: metaErr ? `Failed to RSVP: ${metaErr.message}` : "Event not found." }
  }

  if (eventMeta.status !== "published") {
    return { error: "RSVP is only available for published events." }
  }

  if (eventMeta.rsvp_capacity != null) {
    const { data: occupiedRaw, error: occErr } = await supabase.rpc("published_event_rsvp_occupied_count", {
      p_event_id: eventId,
    })
    if (occErr) {
      return { error: `Failed to RSVP: ${occErr.message}` }
    }
    const occupied = typeof occupiedRaw === "number" ? occupiedRaw : Number(occupiedRaw)
    if (Number.isFinite(occupied) && occupied >= eventMeta.rsvp_capacity) {
      return { error: "This event is at RSVP capacity." }
    }
  }

  const now = new Date().toISOString()

  const { data: upserted, error } = await supabase
    .from("event_registrations")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        status: "confirmed",
        updated_at: now,
        cancelled_at: null,
        checked_in_at: null,
      },
      { onConflict: "event_id,user_id" },
    )
    .select("id")
    .single()

  if (error) {
    if (isRsvpCapacityError(error.message)) {
      return { error: "This event is at RSVP capacity." }
    }
    return { error: `Failed to RSVP: ${error.message}` }
  }

  if (!upserted?.id) {
    return { error: "Failed to RSVP: could not save registration." }
  }

  const minted = await mintFreeRsvpTicketForRegistration(supabase, upserted.id, ticketTypeId ?? null)
  if ("error" in minted) return { error: minted.error }

  revalidatePath("/dashboard/tickets")
  revalidatePath("/tickets")
  revalidatePath("/events")
  if (eventMeta.slug) revalidatePath(`/events/${eventMeta.slug}`)
  return { success: true, ticketId: minted.ticketId }
}

export async function cancelRsvp(eventId: string) {
  const { user, supabase } = await requireAuth()

  if (!eventId) return { error: "Missing event ID." }

  // Idempotency:
  // - If no registration exists yet, treat cancel as a no-op.
  // - If already cancelled, treat as success.
  const { data: existing, error: existingError } = await supabase
    .from("event_registrations")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingError) {
    return { error: `Failed to cancel RSVP: ${existingError.message}` }
  }

  if (!existing || existing.status === "cancelled") {
    revalidatePath("/dashboard/tickets")
    revalidatePath("/tickets")
    revalidatePath("/events")
    const { data: ev } = await supabase.from("events").select("slug").eq("id", eventId).maybeSingle()
    if (ev?.slug) revalidatePath(`/events/${ev.slug}`)
    return { success: true }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("event_registrations")
    .update({
      status: "cancelled",
      cancelled_at: now,
      updated_at: now,
      checked_in_at: null,
    })
    .eq("event_id", eventId)
    .eq("user_id", user.id)

  if (error) {
    return { error: `Failed to cancel RSVP: ${error.message}` }
  }

  revalidatePath("/dashboard/tickets")
  revalidatePath("/tickets")
  revalidatePath("/events")
  const { data: ev } = await supabase.from("events").select("slug").eq("id", eventId).maybeSingle()
  if (ev?.slug) revalidatePath(`/events/${ev.slug}`)
  return { success: true }
}

export async function getMyRegistrationForEvent(eventId: string) {
  const { user, supabase } = await requireAuth()

  const { data, error } = await supabase
    .from("event_registrations")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return { error: error.message }
  return { registration: data }
}
