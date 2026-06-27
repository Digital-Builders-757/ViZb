"use client"

import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { formatDashboardDayPanelHeading } from "@/lib/events/dashboard-calendar"
import { DashboardCategoryChips } from "@/components/dashboard/calendar/dashboard-category-chips"
import { formatDashboardEventTimeShort } from "@/lib/events/event-display-format"
import { Clock3, MapPin } from "lucide-react"

export interface DashboardCalendarDayPanelProps {
  dayKey: string
  events: DashboardCalendarEvent[]
  onSelectEvent: (eventId: string) => void
}

export function DashboardCalendarDayPanel({
  dayKey,
  events,
  onSelectEvent,
}: DashboardCalendarDayPanelProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-4">
      <div className="border-b border-[color:var(--neon-hairline)]/80 pb-3">
        <p className="font-serif text-lg font-bold leading-tight text-[color:var(--neon-text0)] sm:text-xl">
          {formatDashboardDayPanelHeading(dayKey, sorted.length)}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
          Pick a move
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-6 text-center backdrop-blur">
          <p className="text-base leading-relaxed text-[color:var(--neon-text1)]">
            No events on this day. Pick another date on the calendar.
          </p>
        </div>
      ) : (
        <ul className="min-w-0 space-y-2.5">
          {sorted.map((e) => (
            <li key={e.id} className="min-w-0">
              <button
                type="button"
                className="planner-tide-row grid w-full min-w-0 gap-3 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-3 py-3 text-left backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] hover:shadow-[0_0_18px_rgb(0_209_255/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:px-4"
                onClick={() => onSelectEvent(e.id)}
              >
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--neon-a)]/30 bg-[color:var(--neon-a)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)] sm:w-full sm:justify-center">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {formatDashboardEventTimeShort(e.starts_at, e.ends_at)}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold leading-snug text-[color:var(--neon-text0)]">
                    {e.title}
                  </p>
                  <p className="mt-2 flex min-w-0 items-start gap-2 break-words text-sm leading-relaxed text-[color:var(--neon-text1)]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neon-b)]" aria-hidden />
                    <span>
                      {e.city}
                      {e.venue_name ? ` - ${e.venue_name}` : ""}
                    </span>
                  </p>
                  <DashboardCategoryChips eventId={e.id} categories={e.categories} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
