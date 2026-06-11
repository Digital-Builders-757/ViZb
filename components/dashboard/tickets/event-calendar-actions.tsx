"use client"

import { CalendarPlus, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { trackProductEvent, type ProductEventContext } from "@/lib/analytics/product-events"

/** Google Calendar `dates` param: UTC compact form `YYYYMMDDTHHmmssZ`. */
function toGoogleCalendarUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

export function buildGoogleCalendarUrl(opts: {
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

export function buildIcsContent(opts: {
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

/** Trigger a browser download for a pre-built .ics payload (shared by wallet + RSVP success). */
export function downloadIcsBlob(suggestedTitle: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${suggestedTitle.slice(0, 60).replace(/[^\w\s-]/g, "") || "event"}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export function EventCalendarActions({
  title,
  startsAt,
  venueName,
  city,
  eventUrl,
  className,
  analyticsContext,
}: {
  title: string
  startsAt: string
  venueName: string
  city: string
  eventUrl: string
  /** Use `mt-0` when the parent already stacks spacing (e.g. `space-y-*`). */
  className?: string
  analyticsContext?: ProductEventContext
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
    trackProductEvent("calendar_export_clicked", {
      ...analyticsContext,
      channel: "ics",
      source: analyticsContext?.source ?? "event_detail",
    })
    const ics = buildIcsContent({
      title,
      start,
      end,
      location,
      description: details,
    })
    downloadIcsBlob(title, ics)
  }

  return (
    <div className={cn("mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap", className)}>
      <a
        href={googleHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackProductEvent("calendar_export_clicked", {
            ...analyticsContext,
            channel: "google",
            source: analyticsContext?.source ?? "event_detail",
          })
        }
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
