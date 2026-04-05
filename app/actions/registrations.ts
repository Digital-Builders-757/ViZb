"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"

export async function rsvpToEvent(eventId: string) {
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

  if (existing?.status === "checked_in") {
    revalidatePath("/dashboard/tickets")
    return { success: true }
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("event_registrations")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        status: "confirmed",
        updated_at: now,
        cancelled_at: null,
      },
      { onConflict: "event_id,user_id" },
    )

  if (error) {
    return { error: `Failed to RSVP: ${error.message}` }
  }

  revalidatePath("/dashboard/tickets")
  return { success: true }
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
    return { success: true }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("event_id", eventId)
    .eq("user_id", user.id)

  if (error) {
    return { error: `Failed to cancel RSVP: ${error.message}` }
  }

  revalidatePath("/dashboard/tickets")
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
