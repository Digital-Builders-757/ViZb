"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth-helpers"

export async function linkEventRecapPost(eventId: string, postId: string | null) {
  const { supabase } = await requireAdmin()

  const id = eventId?.trim()
  if (!id) return { error: "Missing event." }

  let recapPostId: string | null = postId?.trim() || null

  if (recapPostId) {
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select("id, status")
      .eq("id", recapPostId)
      .maybeSingle()

    if (postErr) return { error: postErr.message }
    if (!post || post.status !== "published") {
      return { error: "Recap must be a published post." }
    }
  }

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("slug")
    .eq("id", id)
    .maybeSingle()

  if (eventErr) return { error: eventErr.message }
  if (!event) return { error: "Event not found." }

  const { error } = await supabase.from("events").update({ recap_post_id: recapPostId }).eq("id", id)

  if (error) return { error: error.message }

  const slug = event.slug as string
  revalidatePath(`/events/${slug}`)
  revalidatePath(`/admin/events/${id}`)
  revalidatePath("/dashboard/tickets")

  return { success: true as const }
}
