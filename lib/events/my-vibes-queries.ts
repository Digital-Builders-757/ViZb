import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeCategories } from "@/lib/events/categories"

const EVENT_SELECT_FOR_JOIN = `
  id,
  title,
  slug,
  description,
  starts_at,
  ends_at,
  venue_name,
  city,
  categories,
  flyer_url,
  status
`

export interface MyVibesEventRow {
  id: string
  title: string
  slug: string
  description: string | null
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
}

/** True if event time range overlaps [nowMs, windowEndMs] (inclusive). Single-instant events use start only. */
function overlapsWindow(
  startsAt: string,
  endsAt: string | null,
  nowMs: number,
  windowEndMs: number,
): boolean {
  const startMs = new Date(startsAt).getTime()
  const endMs = endsAt ? new Date(endsAt).getTime() : startMs
  return startMs <= windowEndMs && endMs >= nowMs
}

export async function fetchMySavedEventIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("event_saves").select("event_id").eq("user_id", userId)

  if (error) {
    console.error("event_saves list:", error.message)
    return []
  }

  return (data ?? []).map((r) => r.event_id as string)
}

type SaveJoinedRow = {
  event_id: string
  events: Record<string, unknown> | Record<string, unknown>[] | null
}

function mapJoinedEvent(raw: Record<string, unknown>): MyVibesEventRow | null {
  if (raw.status !== "published") return null
  return {
    id: String(raw.id),
    title: String(raw.title),
    slug: String(raw.slug),
    description: raw.description != null ? String(raw.description) : null,
    starts_at: String(raw.starts_at),
    ends_at: raw.ends_at != null ? String(raw.ends_at) : null,
    venue_name: String(raw.venue_name),
    city: String(raw.city),
    categories: normalizeCategories(raw.categories as string[] | null),
    flyer_url: raw.flyer_url != null ? String(raw.flyer_url) : null,
  }
}

async function fetchSavedEventsJoined(supabase: SupabaseClient, userId: string): Promise<MyVibesEventRow[]> {
  const { data, error } = await supabase
    .from("event_saves")
    .select(`event_id, events!inner ( ${EVENT_SELECT_FOR_JOIN} )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("event_saves join:", error.message)
    return []
  }

  const rows = (data ?? []) as SaveJoinedRow[]
  const out: MyVibesEventRow[] = []

  for (const row of rows) {
    const ev = row.events
    const obj = Array.isArray(ev) ? ev[0] : ev
    if (!obj || typeof obj !== "object") continue
    const mapped = mapJoinedEvent(obj as Record<string, unknown>)
    if (mapped) out.push(mapped)
  }

  return out
}

/** Saved events that are still upcoming/ongoing and start within the next `days` days (from `now`). */
export async function fetchMyVibesEventsInWindow(
  supabase: SupabaseClient,
  userId: string,
  days: number,
): Promise<MyVibesEventRow[]> {
  const nowMs = Date.now()
  const windowEndMs = nowMs + days * 24 * 60 * 60 * 1000
  const all = await fetchSavedEventsJoined(supabase, userId)
  return all.filter((e) => overlapsWindow(e.starts_at, e.ends_at, nowMs, windowEndMs))
}

export type MyVibesWeekGrouped = Record<string, MyVibesEventRow[]>

/** Eastern date key (YYYY-MM-DD) grouping for dashboard “This Week” (default 14-day start window). */
export function groupMyVibesByEasternDay(events: MyVibesEventRow[]): MyVibesWeekGrouped {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const grouped: MyVibesWeekGrouped = {}
  const sorted = [...events].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  )
  for (const e of sorted) {
    const key = formatter.format(new Date(e.starts_at))
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  }
  return grouped
}

export async function fetchMyVibesThisWeekGrouped(
  supabase: SupabaseClient,
  userId: string,
  days = 14,
): Promise<MyVibesWeekGrouped> {
  const rows = await fetchMyVibesEventsInWindow(supabase, userId, days)
  return groupMyVibesByEasternDay(rows)
}

/** Upcoming / ongoing saved events in the next 30 days — for multi-event ICS. */
export async function fetchMyVibesForIcs(supabase: SupabaseClient, userId: string): Promise<MyVibesEventRow[]> {
  return fetchMyVibesEventsInWindow(supabase, userId, 30)
}
