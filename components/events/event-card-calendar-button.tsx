"use client"

import { CalendarPlus } from "lucide-react"
import { useState } from "react"
import {
  buildGoogleCalendarUrl,
  buildIcsContent,
  downloadIcsBlob,
} from "@/components/dashboard/tickets/event-calendar-actions"
import { trackProductEvent, type ProductEventContext } from "@/lib/analytics/product-events"

export interface EventCardCalendarButtonProps {
  title: string
  startsAt: string
  venueName: string
  city: string
  eventUrl: string
  analyticsContext?: ProductEventContext
  disabled?: boolean
}

export function EventCardCalendarButton({
  title,
  startsAt,
  venueName,
  city,
  eventUrl,
  analyticsContext,
  disabled = false,
}: EventCardCalendarButtonProps) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return null

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
      source: analyticsContext?.source ?? "events_listing",
    })
    const ics = buildIcsContent({
      title,
      start,
      end,
      location,
      description: details,
    })
    downloadIcsBlob(title, ics)
    setSaved(true)
    setOpen(false)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="vibe-focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text1)] transition-colors hover:border-[color:var(--neon-a)]/45 hover:text-[color:var(--neon-a)] disabled:opacity-50 sm:text-[10px]"
      >
        <CalendarPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {saved ? "Added" : "Calendar"}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close calendar menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute bottom-full left-0 z-50 mb-2 min-w-[11rem] overflow-hidden rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/95 py-1 shadow-[var(--vibe-neon-glow-subtle)] backdrop-blur"
          >
            <a
              role="menuitem"
              href={googleHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackProductEvent("calendar_export_clicked", {
                  ...analyticsContext,
                  channel: "google",
                  source: analyticsContext?.source ?? "events_listing",
                })
                setOpen(false)
              }}
              className="block px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] hover:bg-[color:var(--neon-a)]/12"
            >
              Google Calendar
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={downloadIcs}
              className="block w-full px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text1)] hover:bg-[color:var(--neon-surface)]/40 hover:text-[color:var(--neon-text0)]"
            >
              Download .ics
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
