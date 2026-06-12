/** Virginia / DMV discovery helpers — America/New_York civil time. */

export const DISCOVERY_ET = "America/New_York"

const etKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DISCOVERY_ET,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export type DiscoveryPreset =
  | "tonight"
  | "weekend"
  | "free"
  | "paid"
  | "family"
  | "after_hours"
  | "open_mic"

export const DISCOVERY_PRESET_OPTIONS: { value: DiscoveryPreset; label: string }[] = [
  { value: "tonight", label: "Tonight" },
  { value: "weekend", label: "This weekend" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "family", label: "Family-friendly" },
  { value: "after_hours", label: "After hours" },
  { value: "open_mic", label: "Open mic" },
]

/** YYYY-MM-DD in Eastern for an instant. */
export function easternDateKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate
  return etKeyFormatter.format(d)
}

function easternWeekdayAndHour(isoOrDate: string | Date): { weekday: string; hour: number } {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISCOVERY_ET,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(d)

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? ""
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0"
  const hour = Number.parseInt(hourStr, 10)
  return {
    weekday,
    hour: Number.isFinite(hour) ? hour : 0,
  }
}

/** Event start falls on the same Eastern calendar day as `now`. */
export function matchesTonight(startsAtIso: string, now: Date): boolean {
  return easternDateKey(startsAtIso) === easternDateKey(now)
}

/** Fri ≥ 5pm ET, Saturday, or Sunday. */
export function matchesWeekend(startsAtIso: string, _now: Date): boolean {
  const { weekday, hour } = easternWeekdayAndHour(startsAtIso)
  const w = weekday.toLowerCase()

  if (w.startsWith("sat") || w.startsWith("sun")) return true
  if (w.startsWith("fri") && hour >= 17) return true
  return false
}

/** Start at or after 21:00 Eastern. */
export function matchesAfterHours(startsAtIso: string): boolean {
  const { hour } = easternWeekdayAndHour(startsAtIso)
  return hour >= 21
}

/**
 * Heuristic until a dedicated tag exists: workshops and socials read as calmer / family-adjacent.
 */
export function matchesFamilyFriendly(categories: string[]): boolean {
  const s = new Set(categories.map((c) => c.toLowerCase()))
  return s.has("workshop") || s.has("social")
}

export function matchesOpenMic(categories: string[]): boolean {
  return categories.some((c) => c.toLowerCase() === "open_mic")
}

export type TicketStub = {
  price_cents: number | null
  sales_starts_at: string | null
  sales_ends_at: string | null
}

/**
 * Community listings: free to discover on ViZb (RSVP off-platform).
 * Official: free RSVP tier on sale, or no ticket rows (legacy free path), or not paid-only on sale.
 */
export function matchesFree(opts: {
  isCommunity: boolean
  ticketTypes: TicketStub[] | null | undefined
  now: Date
}): boolean {
  if (opts.isCommunity) return true

  const rows = opts.ticketTypes ?? []
  if (rows.length === 0) return true

  let hasOnSaleFree = false
  let hasOnSalePaid = false

  for (const row of rows) {
    const pc = row.price_cents
    const price = typeof pc === "number" ? pc : Number(pc)
    if (!Number.isFinite(price)) continue

    if (row.sales_starts_at && new Date(row.sales_starts_at) > opts.now) continue
    if (row.sales_ends_at && new Date(row.sales_ends_at) < opts.now) continue

    if (price === 0) hasOnSaleFree = true
    else if (price > 0) hasOnSalePaid = true
  }

  if (hasOnSaleFree) return true
  if (hasOnSalePaid && !hasOnSaleFree) return false
  return true
}

/** On-sale paid tier exists (excludes community listings). */
export function matchesPaid(opts: {
  isCommunity: boolean
  ticketTypes: TicketStub[] | null | undefined
  now: Date
}): boolean {
  if (opts.isCommunity) return false
  const rows = opts.ticketTypes ?? []
  for (const row of rows) {
    const pc = row.price_cents
    const price = typeof pc === "number" ? pc : Number(pc)
    if (!Number.isFinite(price) || price <= 0) continue
    if (row.sales_starts_at && new Date(row.sales_starts_at) > opts.now) continue
    if (row.sales_ends_at && new Date(row.sales_ends_at) < opts.now) continue
    return true
  }
  return false
}

export function parseDiscoveryParam(raw: string | string[] | undefined): DiscoveryPreset | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (!v) return null
  const s = v.toLowerCase().trim()
  const allowed: DiscoveryPreset[] = [
    "tonight",
    "weekend",
    "free",
    "paid",
    "family",
    "after_hours",
    "open_mic",
  ]
  return allowed.includes(s as DiscoveryPreset) ? (s as DiscoveryPreset) : null
}

export function parseSortParam(raw: string | string[] | undefined): "soonest" | "city" {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v === "city" ? "city" : "soonest"
}

export function eventMatchesSearch(opts: {
  title: string
  venue_name: string
  city: string
  description?: string | null
  categories: string[]
  orgName: string
  q: string
}): boolean {
  const needle = opts.q.trim().toLowerCase()
  if (!needle) return true

  const hay = [
    opts.title,
    opts.venue_name,
    opts.city,
    opts.orgName,
    opts.description ?? "",
    ...opts.categories,
  ]
    .join(" ")
    .toLowerCase()

  return hay.includes(needle)
}

export function applyDiscoveryPreset(
  preset: DiscoveryPreset,
  row: {
    starts_at: string
    categories: string[]
    event_kind: "official" | "community"
    ticket_types?: TicketStub[] | null
  },
  now: Date,
): boolean {
  switch (preset) {
    case "tonight":
      return matchesTonight(row.starts_at, now)
    case "weekend":
      return matchesWeekend(row.starts_at, now)
    case "after_hours":
      return matchesAfterHours(row.starts_at)
    case "family":
      return matchesFamilyFriendly(row.categories)
    case "open_mic":
      return matchesOpenMic(row.categories)
    case "free":
      return matchesFree({
        isCommunity: row.event_kind === "community",
        ticketTypes: row.ticket_types ?? [],
        now,
      })
    case "paid":
      return matchesPaid({
        isCommunity: row.event_kind === "community",
        ticketTypes: row.ticket_types ?? [],
        now,
      })
    default:
      return true
  }
}

export function compareEventsByCityThenTime(
  a: { city: string; starts_at: string },
  b: { city: string; starts_at: string },
): number {
  const c = a.city.localeCompare(b.city, undefined, { sensitivity: "base" })
  if (c !== 0) return c
  return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
}
