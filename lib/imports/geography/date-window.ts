import {
  HAMPTON_ROADS_LAUNCH_MARKET,
  LAUNCH_MARKET_TIMEZONE,
} from "@/lib/imports/geography/hampton-roads"
import { getDiscoveryScheduleConfig } from "@/lib/imports/geography/schedule-config"
import type { DiscoveryDateWindow } from "@/lib/imports/geography/types"

type BuildWindowOptions = {
  now?: Date
  lookaheadDays?: number
  pastEventGraceDays?: number
}

/** YYYY-MM-DD for a civil date in America/New_York. */
function easternDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAUNCH_MARKET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

/** Parse YYYY-MM-DD to UTC instant at start/end of Eastern civil day. */
function easternCivilDayToUtc(dateKey: string, endOfDay: boolean): Date {
  const [y, m, d] = dateKey.split("-").map((part) => Number.parseInt(part, 10))
  const hour = endOfDay ? 23 : 0
  const minute = endOfDay ? 59 : 0
  const second = endOfDay ? 59 : 0
  const ms = endOfDay ? 999 : 0

  const utcGuess = Date.UTC(y, m - 1, d, hour, minute, second, ms)
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: LAUNCH_MARKET_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  let adjusted = utcGuess
  for (let i = 0; i < 3; i += 1) {
    const parts = formatter.formatToParts(new Date(adjusted))
    const hourPart = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10)
    const minutePart = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10)
    const secondPart = Number.parseInt(parts.find((p) => p.type === "second")?.value ?? "0", 10)
    const targetHour = endOfDay ? 23 : 0
    const targetMinute = endOfDay ? 59 : 0
    const targetSecond = endOfDay ? 59 : 0
    const deltaMs =
      ((targetHour - hourPart) * 3600 +
        (targetMinute - minutePart) * 60 +
        (targetSecond - secondPart)) *
      1000
    adjusted += deltaMs
  }

  return new Date(adjusted)
}

function shiftEasternDateKey(dateKey: string, dayDelta: number): string {
  const [y, m, d] = dateKey.split("-").map((part) => Number.parseInt(part, 10))
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  base.setUTCDate(base.getUTCDate() + dayDelta)
  return easternDateKey(base)
}

/**
 * Build a UTC ISO discovery window anchored to Eastern civil calendar days.
 * Start includes past-event grace; end is end-of-day on the lookahead horizon.
 */
export function buildDiscoveryDateWindow(options: BuildWindowOptions = {}): DiscoveryDateWindow {
  const config = getDiscoveryScheduleConfig()
  const now = options.now ?? new Date()
  const lookaheadDays = options.lookaheadDays ?? config.lookaheadDays
  const pastEventGraceDays = options.pastEventGraceDays ?? config.pastEventGraceDays

  const todayKey = easternDateKey(now)
  const startKey = shiftEasternDateKey(todayKey, -pastEventGraceDays)
  const endKey = shiftEasternDateKey(todayKey, lookaheadDays)

  return {
    rangeStartIso: easternCivilDayToUtc(startKey, false).toISOString(),
    rangeEndIso: easternCivilDayToUtc(endKey, true).toISOString(),
    timezone: HAMPTON_ROADS_LAUNCH_MARKET.timezone,
    lookaheadDays,
    pastEventGraceDays,
  }
}
