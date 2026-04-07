/** URL params, Eastern date keys, and row typing — safe for Client Components (no server imports). */

export interface DashboardCalendarEvent {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
}

function formatCalKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`
}

/** Parse `?cal=YYYY-MM` for dashboard month view; invalid values fall back to current calendar month. */
export function parseDashboardCalendarMonth(cal: string | undefined | null): {
  year: number
  monthIndex: number
  calKey: string
} {
  const now = new Date()
  const yDefault = now.getFullYear()
  const mDefault = now.getMonth()
  if (!cal || typeof cal !== "string" || !/^\d{4}-\d{1,2}$/.test(cal.trim())) {
    return { year: yDefault, monthIndex: mDefault, calKey: formatCalKey(yDefault, mDefault) }
  }
  const [ys, ms] = cal.trim().split("-")
  const year = Number(ys)
  const monthNum = Number(ms)
  if (!Number.isFinite(year) || !Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) {
    return { year: yDefault, monthIndex: mDefault, calKey: formatCalKey(yDefault, mDefault) }
  }
  if (year < 2000 || year > 2100) {
    return { year: yDefault, monthIndex: mDefault, calKey: formatCalKey(yDefault, mDefault) }
  }
  const monthIndex = monthNum - 1
  return { year, monthIndex, calKey: formatCalKey(year, monthIndex) }
}

export function shiftCalKey(year: number, monthIndex: number, deltaMonths: number): string {
  const d = new Date(year, monthIndex + deltaMonths, 1)
  return formatCalKey(d.getFullYear(), d.getMonth())
}

/** Eastern (America/New_York) calendar date for an instant — used for “what’s on in town” month grid. */
export function easternDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso))
  const y = parts.find((p) => p.type === "year")?.value
  const m = parts.find((p) => p.type === "month")?.value
  const d = parts.find((p) => p.type === "day")?.value
  return `${y}-${m}-${d}`
}

export function eventStartsInEasternMonth(iso: string, year: number, monthIndex: number): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(iso))
  const y = Number(parts.find((p) => p.type === "year")?.value)
  const m = Number(parts.find((p) => p.type === "month")?.value) - 1
  return y === year && m === monthIndex
}

/** Start of month as Eastern-style calendar key (matches `easternDateKey` / grid). */
export function monthFirstDayKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`
}

/**
 * Picker/grid `Date` for a day key in the viewed month (local date parts = civil Y-M-D).
 */
export function dateFromDayKey(dayKey: string): Date {
  const [ys, ms, ds] = dayKey.split("-").map(Number)
  return new Date(ys, ms - 1, ds)
}

/**
 * Default selected day: today if it has events (current Eastern month); else next event day in-month;
 * else first of month. Past Eastern months → first of month; future → first day with an event.
 */
export function defaultSelectedDayKey(
  year: number,
  monthIndex: number,
  eventsByDay: ReadonlyMap<string, DashboardCalendarEvent[]>,
): string {
  const firstOfMonth = monthFirstDayKey(year, monthIndex)
  const eventDays = [...eventsByDay.keys()].sort()
  if (eventDays.length === 0) return firstOfMonth

  const todayKey = easternDateKey(new Date().toISOString())
  const [ey, em] = todayKey.split("-").map(Number)
  const easternNowMonthIndex = em - 1

  const viewedBeforeEasternMonth =
    year < ey || (year === ey && monthIndex < easternNowMonthIndex)
  const viewedAfterEasternMonth =
    year > ey || (year === ey && monthIndex > easternNowMonthIndex)

  if (viewedBeforeEasternMonth) return firstOfMonth
  if (viewedAfterEasternMonth) return eventDays[0] ?? firstOfMonth

  if (eventsByDay.has(todayKey)) return todayKey
  const next = eventDays.find((d) => d >= todayKey)
  if (next) return next
  return firstOfMonth
}

/** Panel title like "Mon, Apr 7 + 3 events". */
export function formatDashboardDayPanelHeading(dayKey: string, eventCount: number): string {
  const [ys, ms, ds] = dayKey.split("-").map(Number)
  const date = new Date(ys, ms - 1, ds)
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
  return `${label} + ${eventCount} event${eventCount === 1 ? "" : "s"}`
}
