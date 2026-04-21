"use client"

import { useMemo } from "react"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { agendaDayKeysFromToday } from "@/lib/events/dashboard-calendar"
import { formatDashboardEventTimeShort } from "@/lib/events/event-display-format"
import { DashboardCategoryChips } from "@/components/dashboard/calendar/dashboard-category-chips"
import { cn } from "@/lib/utils"

export interface DashboardCalendarAgendaProps {
  eventsByDay: Map<string, DashboardCalendarEvent[]>
  selectedDayKey: string
  onSelectDay: (dayKey: string) => void
  onSelectEvent: (eventId: string) => void
}

function formatAgendaDayHeading(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function DashboardCalendarAgenda({
  eventsByDay,
  selectedDayKey,
  onSelectDay,
  onSelectEvent,
}: DashboardCalendarAgendaProps) {
  const dayKeys = useMemo(() => agendaDayKeysFromToday(), [])

  const groups = useMemo(() => {
    const out: { dayKey: string; events: DashboardCalendarEvent[] }[] = []
    for (const k of dayKeys) {
      const evs = eventsByDay.get(k)
      if (!evs?.length) continue
      out.push({
        dayKey: k,
        events: [...evs].sort(
          (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
      })
    }
    return out
  }, [dayKeys, eventsByDay])

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-8 text-center backdrop-blur">
        <p className="text-sm text-[color:var(--neon-text1)]">
          No published events in the next 30 days.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6" role="list">
      {groups.map(({ dayKey, events }) => (
        <div key={dayKey} className="min-w-0 space-y-2" role="listitem">
          <h3
            className={cn(
              "border-b border-[color:var(--neon-hairline)] pb-2 font-serif text-base font-bold text-[color:var(--neon-text0)]",
              dayKey === selectedDayKey && "text-[color:var(--neon-a)]",
            )}
          >
            {formatAgendaDayHeading(dayKey)}
          </h3>
          <ul className="flex min-w-0 flex-col gap-2">
            {events.map((e) => (
              <li key={e.id} className="min-w-0">
                <button
                  type="button"
                  className="w-full min-w-0 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-3 py-3 text-left backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] hover:shadow-[0_0_16px_rgb(0_209_255/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--neon-bg0)] sm:px-4"
                  onClick={() => {
                    onSelectDay(dayKey)
                    onSelectEvent(e.id)
                  }}
                >
                  <p className="break-words font-semibold text-[color:var(--neon-text0)]">{e.title}</p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--neon-a)]">
                    {formatDashboardEventTimeShort(e.starts_at, e.ends_at)}
                  </p>
                  <p className="mt-1 break-words text-sm text-[color:var(--neon-text1)]">
                    {e.city}
                    {e.venue_name ? ` · ${e.venue_name}` : ""}
                  </p>
                  <DashboardCategoryChips eventId={e.id} categories={e.categories} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
