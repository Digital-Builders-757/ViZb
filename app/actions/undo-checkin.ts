"use server"

import { requireAdmin } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"

export async function undoCheckInRegistration(params: {
  eventId: string
  userId: string
}) {
  const { supabase } = await requireAdmin()

  const eventId = params.eventId?.trim()
  const userId = params.userId?.trim()

  if (!eventId || !userId) return { error: "Missing event or user." }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("event_registrations")
    .update({ status: "confirmed", checked_in_at: null, updated_at: now })
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "checked_in")
    .select("user_id")

  if (error) return { error: error.message }

  if (!data || data.length === 0) {
    return { error: "No checked-in RSVP found to undo." }
  }

  revalidatePath(`/admin/events/${eventId}`)
  return { success: true }
}
