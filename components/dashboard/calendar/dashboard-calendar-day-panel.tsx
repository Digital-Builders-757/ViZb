"use client"

import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { formatDashboardDayPanelHeading } from "@/lib/events/dashboard-calendar"
import {
  formatCategoryLabel,
  formatDashboardEventTimeShort,
} from "@/lib/events/event-display-format"

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
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <div className="border-b border-[color:var(--neon-hairline)]/80 pb-3">
        <p className="font-serif text-base font-bold text-[color:var(--neon-text0)] md:text-lg">
          {formatDashboardDayPanelHeading(dayKey, sorted.length)}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-text2)]">
          Choose an event
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-6 text-center backdrop-blur">
          <p className="text-sm text-[color:var(--neon-text1)]">
            No events on this day. Pick another date on the calendar.
          </p>
        </div>
      ) : (
        <ul className="min-w-0 space-y-2">
          {sorted.map((e) => (
            <li key={e.id} className="min-w-0">
              <button
                type="button"
                className="block w-full min-w-0 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-3 py-3 text-left backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] hover:shadow-[0_0_18px_rgb(0_209_255/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] sm:px-4"
                onClick={() => onSelectEvent(e.id)}
              >
                <p className="break-words font-semibold text-[color:var(--neon-text0)]">{e.title}</p>
                <p className="mt-1 font-mono text-xs text-[color:var(--neon-a)]">
                  {formatDashboardEventTimeShort(e.starts_at, e.ends_at)}
                </p>
                <p className="mt-1 break-words text-sm text-[color:var(--neon-text1)]">
                  {e.city}
                  {e.venue_name ? ` · ${e.venue_name}` : ""}
                </p>
                <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                  {(e.categories?.length ?? 0) > 0 ? (
                    e.categories.map((c) => (
                      <span
                        key={`${e.id}-${c}`}
                        className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[color:var(--neon-text1)] shadow-[0_0_12px_rgba(0,209,255,0.06)]"
                      >
                        {formatCategoryLabel(c)}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-2.5 py-0.5 font-mono text-[10px] text-[color:var(--neon-text1)]">
                      Event
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
