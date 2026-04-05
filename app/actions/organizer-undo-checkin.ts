"use server"

import { requireOrgMember } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function organizerUndoCheckInRegistration(params: {
  orgSlug: string
  eventSlug: string
  eventId: string
  userId: string
}) {
  const orgSlug = params.orgSlug?.trim()
  const eventSlug = params.eventSlug?.trim()
  const eventId = params.eventId?.trim()
  const userId = params.userId?.trim()

  if (!orgSlug || !eventSlug || !eventId || !userId) {
    return { error: "Missing parameters." }
  }

  const { membership, org } = await requireOrgMember(orgSlug)
  if (!['owner', 'admin'].includes(membership.role)) {
    return { error: "Only org owners/admins can undo check-in." }
  }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("org_id", org.id)
    .single()

  if (!event) return { error: "Event not found." }

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

  revalidatePath(`/organizer/${orgSlug}/events/${eventSlug}`)
  return { success: true }
}
