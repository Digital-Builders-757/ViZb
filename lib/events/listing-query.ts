import type { DiscoveryPreset } from "@/lib/events/discovery-filters"

export type ListingQueryOpts = {
  category?: string | null
  city?: string | null
  vibes?: boolean
  discover?: DiscoveryPreset | null
  q?: string | null
  sort?: "soonest" | "city"
}

/** Serialize `/events` query string; preserves filters, vibes, discovery, search, sort. */
export function eventsListingQuery(opts: ListingQueryOpts): string {
  const sp = new URLSearchParams()
  if (opts.category && opts.category !== "all") {
    sp.set("category", opts.category.toLowerCase())
  }
  if (opts.city?.trim()) {
    sp.set("city", opts.city.trim())
  }
  if (opts.vibes) sp.set("vibes", "1")
  if (opts.discover) sp.set("discover", opts.discover)
  const trimmed = typeof opts.q === "string" ? opts.q.trim() : ""
  if (trimmed) sp.set("q", trimmed)
  if (opts.sort === "city") sp.set("sort", "city")
  const q = sp.toString()
  return q ? `?${q}` : ""
}

export function parseCityParam(raw: string | string[] | undefined): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (!v?.trim()) return null
  return v.trim()
}

/** Top cities by event count for tide filter chips. */
export function buildCityFilterOptions(events: { city: string }[], limit = 8): string[] {
  const counts = new Map<string, number>()
  for (const e of events) {
    const city = e.city.trim()
    if (!city) continue
    counts.set(city, (counts.get(city) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([city]) => city)
}
