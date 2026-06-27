"use client"

import { useMemo } from "react"
import { Clock3, MapPin } from "lucide-react"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { agendaDayKeysFromToday } from "@/lib/events/dashboard-calendar"
import { formatDashboardEventTimeShort } from "@/lib/events/event-display-format"
import { DashboardCategoryChips } from "@/components/dashboard/calendar/dashboard-category-chips"
import { DashboardCalendarRowActions } from "@/components/dashboard/calendar/dashboard-calendar-row-actions"
import { cn } from "@/lib/utils"

export interface DashboardCalendarAgendaProps {
  eventsByDay: Map<string, DashboardCalendarEvent[]>
  selectedDayKey: string
  onSelectDay: (dayKey: string) => void
  onSelectEvent: (eventId: string) => void
  isSavedEvent: (eventId: string) => boolean
  onSavedChange: (eventId: string, nextSaved: boolean) => void
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
  isSavedEvent,
  onSavedChange,
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
      <div className="rounded-lg border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-8 text-center backdrop-blur">
        <p className="text-sm leading-relaxed text-[color:var(--neon-text1)]">
          No published events in the next 30 days.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6" role="list">
      {groups.map(({ dayKey, events }) => (
        <div key={dayKey} className="min-w-0 space-y-2.5" role="listitem">
          <h3
            className={cn(
              "border-b border-[color:var(--neon-hairline)] pb-2 font-serif text-base font-bold text-[color:var(--neon-text0)]",
              dayKey === selectedDayKey && "text-[color:var(--neon-a)]",
            )}
          >
            {formatAgendaDayHeading(dayKey)}
          </h3>
          <ul className="flex min-w-0 flex-col gap-2.5">
            {events.map((e) => (
              <li key={e.id} className="min-w-0">
                <article className="planner-tide-row overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] hover:shadow-[0_0_16px_rgb(0_209_255/0.08)]">
                  <button
                    type="button"
                    className="grid w-full min-w-0 gap-3 px-3 py-3 text-left transition-colors hover:bg-[color:var(--neon-surface)]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--neon-a)] sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:px-4"
                    onClick={() => {
                      onSelectDay(dayKey)
                      onSelectEvent(e.id)
                    }}
                  >
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--neon-a)]/30 bg-[color:var(--neon-a)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)] sm:w-full sm:justify-center">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      {formatDashboardEventTimeShort(e.starts_at, e.ends_at)}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold leading-snug text-[color:var(--neon-text0)]">
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
                  <DashboardCalendarRowActions
                    event={e}
                    initialSaved={isSavedEvent(e.id)}
                    onSavedChange={onSavedChange}
                    source="dashboard_calendar_agenda"
                  />
                </article>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
