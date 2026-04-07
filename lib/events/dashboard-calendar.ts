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
  host_org_name: string | null
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

/** e.g. "Apr 6–12" or "Apr 28 – May 4" for a Sunday–Saturday strip. */
export function formatWeekStripRangeLabel(startDayKey: string, endDayKey: string): string {
  const [y1, m1, d1] = startDayKey.split("-").map(Number)
  const [y2, m2, d2] = endDayKey.split("-").map(Number)
  const a = new Date(y1, m1 - 1, d1)
  const b = new Date(y2, m2 - 1, d2)
  const sameMonth = y1 === y2 && m1 === m2
  const mo = new Intl.DateTimeFormat("en-US", { month: "short" })
  const dm = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
  if (sameMonth) return `${mo.format(a)} ${d1}–${d2}`
  return `${dm.format(a)} – ${dm.format(b)}`
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

/** Calendar day keys for the Sunday-start week containing `anchorDayKey`. */
export function weekDayKeysSundayStart(anchorDayKey: string): string[] {
  const [y, m, d] = anchorDayKey.split("-").map(Number)
  const anchor = new Date(y, m - 1, d)
  const dow = anchor.getDay()
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - dow)
  const keys: string[] = []
  for (let i = 0; i < 7; i++) {
    const dt = new Date(start)
    dt.setDate(start.getDate() + i)
    keys.push(
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`,
    )
  }
  return keys
}

export function addCalendarDaysToDayKey(dayKey: string, deltaDays: number): string {
  const [y, m, d] = dayKey.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + deltaDays)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

/** Eastern "today" through +30 days inclusive (31 keys) for agenda list. */
export function agendaDayKeysFromToday(): string[] {
  const today = easternDateKey(new Date().toISOString())
  return Array.from({ length: 31 }, (_, i) => addCalendarDaysToDayKey(today, i))
}

export function defaultSelectedDayKeyInSet(
  dayKeys: readonly string[],
  eventsByDay: ReadonlyMap<string, DashboardCalendarEvent[]>,
): string {
  if (dayKeys.length === 0) return easternDateKey(new Date().toISOString())
  const sortedKeys = [...dayKeys].sort()
  const set = new Set(dayKeys)
  const eventDays = sortedKeys.filter((k) => (eventsByDay.get(k)?.length ?? 0) > 0)
  if (eventDays.length === 0) return sortedKeys[0]

  const todayKey = easternDateKey(new Date().toISOString())
  if (set.has(todayKey) && (eventsByDay.get(todayKey)?.length ?? 0) > 0) return todayKey
  const next = eventDays.find((d) => d >= todayKey)
  if (next) return next
  return eventDays[0]
}
