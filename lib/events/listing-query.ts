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

/** Normalize city labels for filter chips (trim, title-case, dedupe by lowercase key). */
export function normalizeCityLabel(city: string): string {
  const trimmed = city.trim().replace(/\s+/g, " ")
  if (!trimmed) return ""
  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

const VIRGINIA_CITY_SUFFIX = /,\s*va\b/i

/** True when a city label includes a Virginia state suffix (e.g. "Norfolk, Va"). */
export function hasVirginiaCitySuffix(label: string): boolean {
  return VIRGINIA_CITY_SUFFIX.test(label.trim())
}

/** Strip trailing ", va" / ", virginia" for loose city matching. */
function stripVirginiaCitySuffix(label: string): string {
  return normalizeCityLabel(label).replace(/,\s*(va|virginia)\s*$/i, "").trim()
}

/** Match event city to an active filter city, ignoring state suffix differences. */
export function cityMatchesFilter(eventCity: string, filterCity: string): boolean {
  const eventBase = stripVirginiaCitySuffix(eventCity)
  const filterBase = stripVirginiaCitySuffix(filterCity)
  if (!eventBase || !filterBase) return false
  return eventBase.toLowerCase() === filterBase.toLowerCase()
}

/** Top cities by event count for tide filter chips. */
export function buildCityFilterOptions(events: { city: string }[], limit = 8): string[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const e of events) {
    const label = normalizeCityLabel(e.city)
    if (!label) continue
    const key = label.toLowerCase()
    const existing = counts.get(key)
    if (existing) existing.count += 1
    else counts.set(key, { label, count: 1 })
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .filter((v) => hasVirginiaCitySuffix(v.label))
    .slice(0, limit)
    .map((v) => v.label)
}
