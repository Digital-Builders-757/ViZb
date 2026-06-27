"use client"

import { CalendarPlus } from "lucide-react"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { MyVibesButton } from "@/components/events/my-vibes-button"
import { trackProductEvent } from "@/lib/analytics/product-events"

export function DashboardCalendarRowActions({
  event,
  initialSaved,
  onSavedChange,
  source,
}: {
  event: DashboardCalendarEvent
  initialSaved: boolean
  onSavedChange: (eventId: string, nextSaved: boolean) => void
  source: string
}) {
  const icsHref = `/api/calendar/ics?slug=${encodeURIComponent(event.slug)}`
  const analyticsContext = {
    event_id: event.id,
    event_slug: event.slug,
    city: event.city,
    source,
  }

  return (
    <div className="grid min-w-0 gap-2 border-t border-[color:var(--neon-hairline)]/70 px-3 pb-3 pt-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-4">
      <MyVibesButton
        key={`${event.id}-${initialSaved}`}
        eventId={event.id}
        eventSlug={event.slug}
        isSignedIn
        initialSaved={initialSaved}
        authHref="/login?redirect=%2Fdashboard"
        variant="dashboard"
        onSavedChange={(nextSaved) => onSavedChange(event.id, nextSaved)}
        analyticsContext={analyticsContext}
      />
      <a
        href={icsHref}
        download
        onClick={() =>
          trackProductEvent("calendar_export_clicked", {
            ...analyticsContext,
            channel: "ics",
            signed_in: true,
          })
        }
        className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 px-3 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text0)] transition-colors hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:bg-[color:var(--neon-surface)]/45 sm:w-auto"
      >
        <CalendarPlus className="h-4 w-4 text-[color:var(--neon-a)]" aria-hidden />
        Calendar
      </a>
    </div>
  )
}
