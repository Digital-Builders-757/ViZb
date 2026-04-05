"use server"

import { requireAdmin } from "@/lib/auth-helpers"

export async function getEventRegistrationsAdmin(eventId: string) {
  const { supabase } = await requireAdmin()

  if (!eventId) return { error: "Missing event ID." }

  const { data, error } = await supabase
    .from("event_registrations")
    .select("status, created_at, user_id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message }

  return { registrations: data ?? [] }
}
