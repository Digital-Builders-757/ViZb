import { homeCityMatchTerms, type MemberHomeCityValue } from "@/lib/member/home-cities"
import { normalizeCategories } from "@/lib/events/categories"

export type RecommendationEventInput = {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  is_staff_pick?: boolean
  event_kind?: "official" | "community"
  org_name?: string | null
}

export type RecommendationContext = {
  preferenceCategories: string[]
  preferenceHomeCities: MemberHomeCityValue[]
  savedCategories: string[]
  rsvpCategories: string[]
  followedOrgIds?: string[]
  followedCategories?: string[]
}

export type ScoredRecommendation = RecommendationEventInput & {
  score: number
  reasons: string[]
}

const STAFF_PICK_BONUS = 12
const CATEGORY_MATCH = 10
const CITY_MATCH = 8
const SAVED_CATEGORY_MATCH = 6
const RSVP_CATEGORY_MATCH = 5
const FOLLOWED_ORG_BONUS = 15
const FOLLOWED_CATEGORY_BONUS = 8
const SOON_DAYS_CAP = 14

function categoryOverlap(eventCats: string[], prefs: string[]): number {
  const set = new Set(prefs.map((c) => c.toLowerCase()))
  return eventCats.filter((c) => set.has(c.toLowerCase())).length
}

function cityMatchesPreference(city: string, homeCities: MemberHomeCityValue[]): boolean {
  const normalized = city.toLowerCase()
  for (const slug of homeCities) {
    const terms = homeCityMatchTerms(slug)
    if (terms.some((t) => normalized.includes(t))) return true
  }
  return false
}

function soonnessBonus(startsAt: string, nowMs: number): number {
  const startMs = new Date(startsAt).getTime()
  const daysOut = (startMs - nowMs) / (24 * 60 * 60 * 1000)
  if (daysOut < 0) return 0
  if (daysOut <= 1) return 6
  if (daysOut <= 3) return 4
  if (daysOut <= SOON_DAYS_CAP) return 2
  return 0
}

/** Pure scoring for unit tests and server ranking. */
export function scoreEventForMember(
  event: RecommendationEventInput,
  ctx: RecommendationContext,
  nowMs = Date.now(),
): ScoredRecommendation {
  const categories = normalizeCategories(event.categories)
  const reasons: string[] = []
  let score = 0

  const prefCatHits = categoryOverlap(categories, ctx.preferenceCategories)
  if (prefCatHits > 0) {
    score += prefCatHits * CATEGORY_MATCH
    reasons.push("Matches your categories")
  }

  if (ctx.preferenceHomeCities.length > 0 && cityMatchesPreference(event.city, ctx.preferenceHomeCities)) {
    score += CITY_MATCH
    reasons.push("Near your cities")
  }

  const savedHits = categoryOverlap(categories, ctx.savedCategories)
  if (savedHits > 0) {
    score += savedHits * SAVED_CATEGORY_MATCH
    reasons.push("Similar to saved events")
  }

  const rsvpHits = categoryOverlap(categories, ctx.rsvpCategories)
  if (rsvpHits > 0) {
    score += rsvpHits * RSVP_CATEGORY_MATCH
    reasons.push("Based on events you joined")
  }

  if (event.is_staff_pick) {
    score += STAFF_PICK_BONUS
    reasons.push("ViZb pick")
  }

  if (ctx.followedOrgIds?.includes(event.id)) {
    // org id check happens at caller with org_id field — handled in rank function
  }

  score += soonnessBonus(event.starts_at, nowMs)

  return { ...event, categories, score, reasons: [...new Set(reasons)] }
}

export type RankableEvent = RecommendationEventInput & { org_id?: string }

export function rankEventsForMember(
  events: RankableEvent[],
  ctx: RecommendationContext,
  limit: number,
  nowMs = Date.now(),
): ScoredRecommendation[] {
  const scored = events.map((event) => {
    let row = scoreEventForMember(event, ctx, nowMs)
    if (event.org_id && ctx.followedOrgIds?.includes(event.org_id)) {
      row = {
        ...row,
        score: row.score + FOLLOWED_ORG_BONUS,
        reasons: [...new Set([...row.reasons, "From an organizer you follow"])],
      }
    }
    const followedCatHits = categoryOverlap(row.categories, ctx.followedCategories ?? [])
    if (followedCatHits > 0) {
      row = {
        ...row,
        score: row.score + followedCatHits * FOLLOWED_CATEGORY_BONUS,
        reasons: [...new Set([...row.reasons, "Category you follow"])],
      }
    }
    return row
  })

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    })
    .slice(0, limit)
}

export function hasPersonalizationSignals(ctx: RecommendationContext): boolean {
  return (
    ctx.preferenceCategories.length > 0 ||
    ctx.preferenceHomeCities.length > 0 ||
    ctx.savedCategories.length > 0 ||
    ctx.rsvpCategories.length > 0 ||
    (ctx.followedOrgIds?.length ?? 0) > 0 ||
    (ctx.followedCategories?.length ?? 0) > 0
  )
}
