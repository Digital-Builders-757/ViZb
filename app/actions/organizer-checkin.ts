"use server"

import { requireOrgMember } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function organizerCheckInRegistration(params: {
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

  // requireOrgMember returns membership role; staff admins get synthetic admin membership.
  const { membership, org } = await requireOrgMember(orgSlug)
  if (!['owner', 'admin'].includes(membership.role)) {
    return { error: "Only org owners/admins can check in attendees." }
  }

  // Extra guard: ensure event belongs to org.
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
    .update({ status: "checked_in", checked_in_at: now, updated_at: now })
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .select("user_id")

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return { error: "No confirmed RSVP found to check in (already checked in or cancelled)." }
  }

  revalidatePath(`/organizer/${orgSlug}/events/${eventSlug}`)
  return { success: true }
}
