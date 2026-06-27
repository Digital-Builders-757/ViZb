/** Pure display helpers - safe for Client Components (no server Supabase imports). */

import { normalizeCategories } from "@/lib/events/categories"
import {
  EVENT_DISPLAY_TIMEZONE,
  EVENT_DISPLAY_TIMEZONE_LABEL,
} from "@/lib/events/eastern-datetime"

/** Cap category chips for compact/medium surfaces; pair with `formatCategoryLabel` when rendering. */
export function sliceCategoriesForDisplay(
  categories: string[] | null | undefined,
  max: number,
): { visible: string[]; extraCount: number } {
  const list = normalizeCategories(categories ?? [])
  if (max <= 0) return { visible: [], extraCount: list.length }
  const visible = list.slice(0, max)
  const extraCount = Math.max(0, list.length - max)
  return { visible, extraCount }
}

export function formatDashboardEventWhen(startsAt: string, endsAt: string | null): string {
  const df = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const startLabel = df.format(new Date(startsAt))
  if (!endsAt) return startLabel
  const endLabel = df.format(new Date(endsAt))
  if (startLabel === endLabel) return startLabel
  return `${startLabel} - ${endLabel}`
}

const CATEGORY_LABEL_OVERRIDES: Record<string, string> = {
  open_mic: "Open mic",
}

export function formatCategoryLabel(category: string): string {
  if (!category) return "Event"
  const key = category.toLowerCase()
  if (CATEGORY_LABEL_OVERRIDES[key]) return CATEGORY_LABEL_OVERRIDES[key]
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace(/_/g, " ")
}

export function formatCategoryLabels(categories: string[] | null | undefined): string {
  if (!categories || categories.length === 0) return "Event"
  return categories.map((c) => formatCategoryLabel(c)).join(" - ")
}

/** Compact Eastern time (and range) for dashboard day rows. */
export function formatDashboardEventTimeShort(startsAt: string, endsAt: string | null): string {
  const tf = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  })
  const start = tf.format(new Date(startsAt))
  if (!endsAt) return start
  const end = tf.format(new Date(endsAt))
  if (start === end) return start
  return `${start} - ${end}`
}

/** Single line: date/window + Eastern times with product timezone label. */
export function formatDashboardEventEtDetailLines(startsAt: string, endsAt: string | null): string {
  const dateLine = formatDashboardEventWhen(startsAt, endsAt)
  const times = formatDashboardEventTimeShort(startsAt, endsAt)
  return `${dateLine} - ${times} ${EVENT_DISPLAY_TIMEZONE_LABEL}`
}

/** Public event detail - long weekday date in Eastern. */
export function formatEventDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

/** Public event detail - clock time in Eastern. */
export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function formatEventTimeWithZone(iso: string): string {
  return `${formatEventTime(iso)} ${EVENT_DISPLAY_TIMEZONE_LABEL}`
}

export function formatEventTimeRangeWithZone(startsAt: string, endsAt: string | null): string {
  const startTime = formatEventTime(startsAt)
  if (!endsAt) return `${startTime} ${EVENT_DISPLAY_TIMEZONE_LABEL}`
  const endTime = formatEventTime(endsAt)
  if (startTime === endTime) return `${startTime} ${EVENT_DISPLAY_TIMEZONE_LABEL}`
  return `${startTime} - ${endTime} ${EVENT_DISPLAY_TIMEZONE_LABEL}`
}

export function formatEventStartLabelWithZone(iso: string): string {
  const dateTime = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
  return `${dateTime} ${EVENT_DISPLAY_TIMEZONE_LABEL}`
}

/** Public event detail - date + time range with product timezone label. */
export function formatEventDateTimeDetail(startsAt: string, endsAt: string | null): string {
  const dateLine = formatEventDateLong(startsAt)
  return `${dateLine} - ${formatEventTimeRangeWithZone(startsAt, endsAt)}`
}

/** Compact Eastern datetime for ticket cards and lists. */
export function formatEventDateTimeCompact(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_DISPLAY_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function formatEventDateTimeCompactWithZone(iso: string): string {
  return `${formatEventDateTimeCompact(iso)} ${EVENT_DISPLAY_TIMEZONE_LABEL}`
}
