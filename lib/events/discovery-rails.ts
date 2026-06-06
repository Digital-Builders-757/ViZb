/** Pure helpers for `/events` discovery rails (Starting soon, ViZb picks). */

export type DiscoveryRailEvent = {
  id: string
  event_kind: "official" | "community"
  is_staff_pick: boolean
  starts_at: string
}

const TRENDING_LIMIT = 3
const STAFF_PICKS_LIMIT = 6

export function buildDiscoveryRails<T extends DiscoveryRailEvent>(upcoming: T[]) {
  const staffPicks = upcoming.filter((e) => e.is_staff_pick).slice(0, STAFF_PICKS_LIMIT)
  const staffPickIds = new Set(staffPicks.map((e) => e.id))

  const officialSoon = upcoming.filter((e) => e.event_kind === "official")
  const trendingPool =
    officialSoon.length > 0
      ? officialSoon.filter((e) => !staffPickIds.has(e.id))
      : upcoming.filter((e) => !staffPickIds.has(e.id))
  const trending = trendingPool.slice(0, TRENDING_LIMIT)

  return { trending, staffPicks }
}
