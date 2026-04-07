/** Server-safe iCalendar (ICS) builder for published events. */

const CRLF = "\r\n"

function icsEscapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
}

function foldLine(line: string): string[] {
  if (line.length <= 75) return [line]
  const chunks: string[] = []
  chunks.push(line.slice(0, 75))
  let rest = line.slice(75)
  while (rest.length > 0) {
    chunks.push(" " + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  return chunks
}

function formatUtcStamp(ms: number): string {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0")
  const da = String(d.getUTCDate()).padStart(2, "0")
  const h = String(d.getUTCHours()).padStart(2, "0")
  const mi = String(d.getUTCMinutes()).padStart(2, "0")
  const s = String(d.getUTCSeconds()).padStart(2, "0")
  return `${y}${mo}${da}T${h}${mi}${s}Z`
}

/** Local (civil) America/New_York wall time as `YYYYMMDDTHHmmss` for TZID lines. */
function formatNyLocal(iso: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d)
  const pick = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value.padStart(2, "0") ?? "00"
  const y = parts.find((p) => p.type === "year")?.value ?? "1970"
  const mo = pick("month")
  const da = pick("day")
  const h = pick("hour")
  const mi = pick("minute")
  const se = pick("second")
  return `${y}${mo}${da}T${h}${mi}${se}`
}

export function buildPublishedEventIcs(params: {
  eventId: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
  venueName: string
  city: string
  eventUrl: string
}): string {
  const endInstant =
    params.endsAt ??
    new Date(new Date(params.startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString()

  const descParts = [params.description?.trim() || "", params.eventUrl].filter(Boolean)
  const description = descParts.join("\n\n")

  const rawLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VIZB//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.eventId}@vizb.local`,
    `DTSTAMP:${formatUtcStamp(Date.now())}`,
    `DTSTART;TZID=America/New_York:${formatNyLocal(params.startsAt)}`,
    `DTEND;TZID=America/New_York:${formatNyLocal(endInstant)}`,
    `SUMMARY:${icsEscapeText(params.title)}`,
    `LOCATION:${icsEscapeText(`${params.venueName}, ${params.city}`)}`,
    `DESCRIPTION:${icsEscapeText(description)}`,
    `URL:${params.eventUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  return rawLines.flatMap(foldLine).join(CRLF) + CRLF
}
