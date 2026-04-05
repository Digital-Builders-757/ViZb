"use server"

import { requireAdmin } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"

export async function checkInRegistration(params: {
  eventId: string
  userId: string
}) {
  const { supabase } = await requireAdmin()

  const eventId = params.eventId?.trim()
  const userId = params.userId?.trim()

  if (!eventId || !userId) return { error: "Missing event or user." }

  const now = new Date().toISOString()

  // Only check-in confirmed RSVPs; keep idempotent.
  const { data, error } = await supabase
    .from("event_registrations")
    .update({ status: "checked_in", checked_in_at: now, updated_at: now })
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .select("user_id")

  if (error) return { error: error.message }

  if (!data || data.length === 0) {
    return { error: "No confirmed RSVP found to check in (already checked in or cancelled)." }
  }

  revalidatePath(`/admin/events/${eventId}`)
  return { success: true }
}
