import type { SupabaseClient } from "@supabase/supabase-js"
import { logError } from "@/lib/log"

export { getEventEffectiveEndMs, isEventPast, isEventUpcomingOrOngoing, EVENT_ENDED_MESSAGE, assertEventAcceptsPublicRegistration } from "@/lib/events/event-schedule"

export type EventRecapPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
}

export async function loadEventRecapPost(
  supabase: SupabaseClient,
  recapPostId: string | null | undefined,
): Promise<EventRecapPost | null> {
  if (!recapPostId) return null

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image_url, status, published_at")
    .eq("id", recapPostId)
    .eq("status", "published")
    .maybeSingle()

  if (error) {
    logError("events.recap", error, { op: "load_post" })
    return null
  }

  if (!data) return null

  const publishedAt = data.published_at as string | null
  if (publishedAt && new Date(publishedAt).getTime() > Date.now()) {
    return null
  }

  return {
    id: data.id as string,
    title: data.title as string,
    slug: data.slug as string,
    excerpt: (data.excerpt as string | null) ?? null,
    coverImageUrl: (data.cover_image_url as string | null) ?? null,
  }
}

