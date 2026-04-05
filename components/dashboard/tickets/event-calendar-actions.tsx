"use client"

import { CalendarPlus, Download } from "lucide-react"

/** Google Calendar `dates` param: UTC compact form `YYYYMMDDTHHmmssZ`. */
function toGoogleCalendarUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function buildGoogleCalendarUrl(opts: {
  title: string
  start: Date
  end: Date
  location: string
  details: string
}) {
  const dates = `${toGoogleCalendarUtc(opts.start)}/${toGoogleCalendarUtc(opts.end)}`
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates,
    details: opts.details,
    location: opts.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,")
}

function buildIcsContent(opts: {
  title: string
  start: Date
  end: Date
  location: string
  description: string
}) {
  const uid = `${opts.start.getTime()}-${Math.random().toString(36).slice(2)}@vizb.local`
  const stamp = toGoogleCalendarUtc(new Date())
  const dtStart = toGoogleCalendarUtc(opts.start)
  const dtEnd = toGoogleCalendarUtc(opts.end)
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VIZB//Tickets//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(opts.title)}`,
    `LOCATION:${icsEscape(opts.location)}`,
    `DESCRIPTION:${icsEscape(opts.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

export function EventCalendarActions({
  title,
  startsAt,
  venueName,
  city,
  eventUrl,
}: {
  title: string
  startsAt: string
  venueName: string
  city: string
  eventUrl: string
}) {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) {
    return null
  }

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const location = [venueName, city].filter(Boolean).join(", ")
  const details = `VIZB event\n${eventUrl}`

  const googleHref = buildGoogleCalendarUrl({
    title,
    start,
    end,
    location,
    details,
  })

  const downloadIcs = () => {
    const ics = buildIcsContent({
      title,
      start,
      end,
      location,
      description: details,
    })
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.slice(0, 60).replace(/[^\w\s-]/g, "") || "event"}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <a
        href={googleHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-a)] sm:w-auto"
      >
        <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
        Add to Google Calendar
      </a>
      <button
        type="button"
        onClick={downloadIcs}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--neon-hairline)] bg-transparent px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text1)] transition-colors hover:border-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] sm:w-auto"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        Download .ics
      </button>
    </div>
  )
}
