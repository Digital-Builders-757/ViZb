"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveEventToMyVibes(eventId: string, eventSlug: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sign in to save events." }
  }

  if (!eventId || !eventSlug) {
    return { error: "Missing event." }
  }

  const { error } = await supabase.from("event_saves").insert({
    user_id: user.id,
    event_id: eventId,
  })

  if (error) {
    if (error.code === "23505") {
      revalidatePathsForVibes(eventSlug)
      return { success: true as const }
    }
    return { error: `Could not save: ${error.message}` }
  }

  revalidatePathsForVibes(eventSlug)
  return { success: true as const }
}

export async function removeEventFromMyVibes(eventId: string, eventSlug: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sign in to manage My Vibes." }
  }

  if (!eventId || !eventSlug) {
    return { error: "Missing event." }
  }

  const { error } = await supabase
    .from("event_saves")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId)

  if (error) {
    return { error: `Could not remove save: ${error.message}` }
  }

  revalidatePathsForVibes(eventSlug)
  return { success: true as const }
}

function revalidatePathsForVibes(eventSlug: string) {
  revalidatePath("/events")
  revalidatePath("/dashboard")
  revalidatePath(`/events/${eventSlug}`)
}
