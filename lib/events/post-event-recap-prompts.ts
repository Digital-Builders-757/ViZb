import type { SupabaseClient } from "@supabase/supabase-js"
import { logError } from "@/lib/log"
import { loadEventRecapPost, isEventPast, type EventRecapPost } from "@/lib/events/event-recap"

export type PostEventRecapPrompt = {
  eventId: string
  eventTitle: string
  eventSlug: string
  recap: EventRecapPost
}

/** Past checked-in events with a linked published recap — for dashboard memory prompts. */
export async function fetchPostEventRecapPrompts(
  supabase: SupabaseClient,
  userId: string,
  limit = 3,
): Promise<PostEventRecapPrompt[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      "event_id, status, events!inner ( id, title, slug, starts_at, ends_at, recap_post_id, status )",
    )
    .eq("user_id", userId)
    .eq("status", "checked_in")
    .order("checked_in_at", { ascending: false })
    .limit(20)

  if (error) {
    logError("events.recap_prompts", error, { op: "load_regs" })
    return []
  }

  const out: PostEventRecapPrompt[] = []
  const nowMs = Date.now()

  for (const row of data ?? []) {
    const evRaw = (row as { events?: Record<string, unknown> | Record<string, unknown>[] }).events
    const ev = Array.isArray(evRaw) ? evRaw[0] : evRaw
    if (!ev || ev.status !== "published") continue
    if (!isEventPast(String(ev.starts_at), ev.ends_at != null ? String(ev.ends_at) : null, nowMs)) {
      continue
    }
    const recap = await loadEventRecapPost(supabase, ev.recap_post_id as string | null)
    if (!recap) continue
    out.push({
      eventId: String(ev.id),
      eventTitle: String(ev.title),
      eventSlug: String(ev.slug),
      recap,
    })
    if (out.length >= limit) break
  }

  return out
}
