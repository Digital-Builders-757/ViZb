import type { SupabaseClient } from "@supabase/supabase-js"
import { logError } from "@/lib/log"
import { normalizeCategories } from "@/lib/events/categories"
import { fetchMemberFollows } from "@/lib/follows/load-follows"
import {
  hasPersonalizationSignals,
  rankEventsForMember,
  type RankableEvent,
  type RecommendationContext,
  type ScoredRecommendation,
} from "@/lib/events/member-recommendations"
import type { MemberPreferencesSnapshot } from "@/lib/member/preferences"

const EVENT_SELECT = `
  id, title, slug, starts_at, ends_at, venue_name, city, categories, flyer_url,
  is_staff_pick, event_kind, org_id,
  organizations ( name )
`

function isUpcomingOrOngoing(startsAt: string, endsAt: string | null, now: Date): boolean {
  if (endsAt) return new Date(endsAt).getTime() >= now.getTime()
  return new Date(startsAt).getTime() >= now.getTime()
}

async function loadBehaviorCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ saved: string[]; rsvp: string[] }> {
  const saved: string[] = []
  const rsvp: string[] = []

  const { data: saves } = await supabase
    .from("event_saves")
    .select("events!inner ( categories )")
    .eq("user_id", userId)
    .limit(40)

  for (const row of saves ?? []) {
    const ev = (row as { events?: { categories?: unknown } | { categories?: unknown }[] }).events
    const obj = Array.isArray(ev) ? ev[0] : ev
    if (obj?.categories) saved.push(...normalizeCategories(obj.categories))
  }

  const { data: regs } = await supabase
    .from("event_registrations")
    .select("events!inner ( categories )")
    .eq("user_id", userId)
    .in("status", ["confirmed", "checked_in"])
    .limit(40)

  for (const row of regs ?? []) {
    const ev = (row as { events?: { categories?: unknown } | { categories?: unknown }[] }).events
    const obj = Array.isArray(ev) ? ev[0] : ev
    if (obj?.categories) rsvp.push(...normalizeCategories(obj.categories))
  }

  return {
    saved: [...new Set(saved)],
    rsvp: [...new Set(rsvp)],
  }
}

function mapEventRow(raw: Record<string, unknown>): RankableEvent | null {
  const orgs = raw.organizations as { name?: string } | { name?: string }[] | null
  const org = Array.isArray(orgs) ? orgs[0] : orgs
  return {
    id: String(raw.id),
    title: String(raw.title),
    slug: String(raw.slug),
    starts_at: String(raw.starts_at),
    ends_at: raw.ends_at != null ? String(raw.ends_at) : null,
    venue_name: String(raw.venue_name),
    city: String(raw.city),
    categories: normalizeCategories(raw.categories as string[] | null),
    flyer_url: raw.flyer_url != null ? String(raw.flyer_url) : null,
    is_staff_pick: Boolean(raw.is_staff_pick),
    event_kind: raw.event_kind === "community" ? "community" : "official",
    org_name: org?.name ?? null,
    org_id: raw.org_id != null ? String(raw.org_id) : undefined,
  }
}

export type ForYouFeed = {
  items: ScoredRecommendation[]
  hasSignals: boolean
  usedFallback: boolean
}

export async function fetchForYouRecommendations(
  supabase: SupabaseClient,
  userId: string,
  prefs: MemberPreferencesSnapshot,
  limit = 4,
): Promise<ForYouFeed> {
  const now = new Date()
  const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .gte("starts_at", pastCutoff.toISOString())
    .order("starts_at", { ascending: true })
    .limit(120)

  if (error) {
    logError("events.for_you", error, { op: "list" })
    return { items: [], hasSignals: false, usedFallback: true }
  }

  const events = (data ?? [])
    .map((row) => mapEventRow(row as Record<string, unknown>))
    .filter((e): e is RankableEvent => e != null)
    .filter((e) => isUpcomingOrOngoing(e.starts_at, e.ends_at, now))

  const behavior = await loadBehaviorCategories(supabase, userId)
  const follows = await fetchMemberFollows(supabase, userId)

  const ctx: RecommendationContext = {
    preferenceCategories: prefs.categories,
    preferenceHomeCities: prefs.homeCities,
    savedCategories: behavior.saved,
    rsvpCategories: behavior.rsvp,
    followedOrgIds: follows.followedOrgIds,
    followedCategories: follows.followedCategories,
  }

  const hasSignals = hasPersonalizationSignals(ctx)
  let ranked = rankEventsForMember(events, ctx, limit, now.getTime())

  let usedFallback = false
  if (ranked.length === 0 || (ranked.every((r) => r.score === 0) && !hasSignals)) {
    usedFallback = true
    ranked = rankEventsForMember(
      events.filter((e) => e.is_staff_pick || e.event_kind === "official"),
      { ...ctx, preferenceCategories: [], preferenceHomeCities: [], savedCategories: [], rsvpCategories: [] },
      limit,
      now.getTime(),
    )
    if (ranked.length === 0) {
      ranked = rankEventsForMember(events, ctx, limit, now.getTime())
    }
  }

  return { items: ranked, hasSignals, usedFallback }
}

/** Upcoming events from followed organizers only. */
export async function fetchFollowedOrganizerEvents(
  supabase: SupabaseClient,
  userId: string,
  limit = 4,
): Promise<ScoredRecommendation[]> {
  const follows = await fetchMemberFollows(supabase, userId)
  if (follows.followedOrgIds.length === 0) return []

  const now = new Date()
  const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .in("org_id", follows.followedOrgIds)
    .gte("starts_at", pastCutoff.toISOString())
    .order("starts_at", { ascending: true })
    .limit(40)

  if (error) {
    logError("events.followed_orgs", error, { op: "list" })
    return []
  }

  const events = (data ?? [])
    .map((row) => mapEventRow(row as Record<string, unknown>))
    .filter((e): e is RankableEvent => e != null)
    .filter((e) => isUpcomingOrOngoing(e.starts_at, e.ends_at, now))

  return rankEventsForMember(
    events,
    {
      preferenceCategories: [],
      preferenceHomeCities: [],
      savedCategories: [],
      rsvpCategories: [],
      followedOrgIds: follows.followedOrgIds,
    },
    limit,
    now.getTime(),
  )
}
