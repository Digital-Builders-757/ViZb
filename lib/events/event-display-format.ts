/** Pure display helpers — safe for Client Components (no server Supabase imports). */

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

export function formatCategoryLabel(category: string): string {
  if (!category) return "Event"
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
}

export function formatCategoryLabels(categories: string[] | null | undefined): string {
  if (!categories || categories.length === 0) return "Event"
  return categories.map((c) => formatCategoryLabel(c)).join(" · ")
}
