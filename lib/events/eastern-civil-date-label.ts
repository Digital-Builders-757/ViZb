/**
 * Format Eastern (America/New_York) **civil calendar** date keys `YYYY-MM-DD`
 * for display — avoids hardcoded UTC offsets that break across DST.
 */
export function formatEasternCivilDayHeading(dateKey: string): string {
  const parts = dateKey.split("-").map((s) => Number.parseInt(s, 10))
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return dateKey
  const [y, m, d] = parts
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return dateKey

  // Noon UTC keeps this instant on the intended civil date in New York for normal event ranges.
  const inst = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(inst)
}
