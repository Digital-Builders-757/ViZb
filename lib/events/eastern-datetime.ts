/** Virginia / Eastern timezone helpers — safe for Client Components (no server imports). */

import { TZDate } from "@date-fns/tz"

export const EVENT_DISPLAY_TIMEZONE = "America/New_York" as const

const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

function parseDatetimeLocalParts(value: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} | null {
  const match = DATETIME_LOCAL_RE.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = match[6] ? Number(match[6]) : 0
  if ([year, month, day, hour, minute, second].some((n) => !Number.isFinite(n))) return null
  return { year, month, day, hour, minute, second }
}

/**
 * Interpret a `datetime-local` value as Eastern wall time and return UTC ISO.
 * Accepts `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`.
 */
export function parseEasternDatetimeLocalToIso(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  const parts = parseDatetimeLocalParts(trimmed)
  if (!parts) return null

  try {
    const zoned = new TZDate(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      EVENT_DISPLAY_TIMEZONE,
    )
    const utcMs = zoned.getTime()
    if (Number.isNaN(utcMs)) return null
    return new Date(utcMs).toISOString()
  } catch {
    return null
  }
}

/** Format a UTC ISO instant as `YYYY-MM-DDTHH:mm` in Eastern for `datetime-local` inputs. */
export function formatIsoToEasternDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00"

  const hour = get("hour") === "24" ? "00" : get("hour")
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`
}

/** Eastern civil calendar date key `YYYY-MM-DD` for a UTC ISO instant. */
export function easternDateKeyFromIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

/**
 * Reinterpret stored UTC components as if they were Eastern wall time.
 * Used to repair manually created events saved without timezone normalization.
 */
export function reinterpretUtcComponentsAsEasternToIso(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null

  const localLike = `${String(d.getUTCFullYear()).padStart(4, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}`
  return parseEasternDatetimeLocalToIso(localLike)
}

/** Noon UTC anchor for an Eastern civil date key — safe for ET date formatting. */
export function easternCivilDateKeyToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map((part) => Number.parseInt(part, 10))
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

/** Day difference between two Eastern civil date keys. */
export function easternCivilDateKeyDiffDays(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map((part) => Number.parseInt(part, 10))
  const [ty, tm, td] = toKey.split("-").map((part) => Number.parseInt(part, 10))
  const fromMs = Date.UTC(fy, fm - 1, fd, 12, 0, 0)
  const toMs = Date.UTC(ty, tm - 1, td, 12, 0, 0)
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24))
}
