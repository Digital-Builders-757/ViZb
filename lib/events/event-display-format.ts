/** Pure display helpers — safe for Client Components (no server Supabase imports). */

import { normalizeCategories } from "@/lib/events/categories"

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
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const startLabel = df.format(new Date(startsAt))
  if (!endsAt) return startLabel
  const endLabel = df.format(new Date(endsAt))
  if (startLabel === endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
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
  return categories.map((c) => formatCategoryLabel(c)).join(" · ")
}

/** Compact Eastern time (and range) for dashboard day rows. */
export function formatDashboardEventTimeShort(startsAt: string, endsAt: string | null): string {
  const tf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  })
  const start = tf.format(new Date(startsAt))
  if (!endsAt) return start
  const end = tf.format(new Date(endsAt))
  if (start === end) return start
  return `${start} – ${end}`
}

/** Single line: date/window + Eastern times with ET suffix. */
export function formatDashboardEventEtDetailLines(startsAt: string, endsAt: string | null): string {
  const dateLine = formatDashboardEventWhen(startsAt, endsAt)
  const times = formatDashboardEventTimeShort(startsAt, endsAt)
  return `${dateLine} · ${times} ET`
}
