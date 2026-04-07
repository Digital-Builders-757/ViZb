"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { DayButton } from "react-day-picker"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import {
  dateFromDayKey,
  defaultSelectedDayKey,
  easternDateKey,
  formatDashboardDayPanelHeading,
  shiftCalKey,
} from "@/lib/events/dashboard-calendar"
import {
  formatCategoryLabel,
  formatDashboardEventTimeShort,
} from "@/lib/events/event-display-format"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { Badge } from "@/components/ui/badge"

interface DashboardMonthCalendarProps {
  year: number
  monthIndex: number
  calKey: string
  events: DashboardCalendarEvent[]
}

function easternPickerDayKey(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")?.value
  const m = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value
  return `${y}-${m}-${day}`
}

function DashboardCalendarDayButton({
  eventsByDay,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  eventsByDay: Map<string, DashboardCalendarEvent[]>
}) {
  const { day } = props
  const key = easternPickerDayKey(day.date)
  const count = eventsByDay.get(key)?.length ?? 0
  return (
    <CalendarDayButton {...props}>
      <span className="text-[0.85rem] font-medium tabular-nums">{day.date.getDate()}</span>
      {count > 0 ? (
        <span className="flex min-h-[0.5rem] items-center justify-center gap-0.5" aria-hidden>
          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
            <span
              key={i}
              className="h-1 w-1 shrink-0 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_8px_rgba(0,209,255,0.75)]"
            />
          ))}
          {count > 3 ? (
            <span className="pl-0.5 text-[6px] font-bold leading-none text-[color:var(--neon-b)]">
              +
            </span>
          ) : null}
        </span>
      ) : null}
    </CalendarDayButton>
  )
}

export function DashboardMonthCalendar({
  year,
  monthIndex,
  calKey,
  events,
}: DashboardMonthCalendarProps) {
  const monthDate = useMemo(() => new Date(year, monthIndex, 1), [year, monthIndex])
  const prevKey = shiftCalKey(year, monthIndex, -1)
  const nextKey = shiftCalKey(year, monthIndex, 1)

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DashboardCalendarEvent[]>()
    for (const e of events) {
      const k = easternDateKey(e.starts_at)
      const list = map.get(k) ?? []
      list.push(e)
      map.set(k, list)
    }
    return map
  }, [events])

  const defaultDayKey = useMemo(
    () => defaultSelectedDayKey(year, monthIndex, eventsByDay),
    [year, monthIndex, eventsByDay],
  )

  const [selectedDay, setSelectedDay] = useState(defaultDayKey)

  useEffect(() => {
    setSelectedDay(defaultDayKey)
  }, [defaultDayKey])

  const selectedDate = useMemo(() => dateFromDayKey(selectedDay), [selectedDay])
  const selectedEvents = useMemo(() => {
    const list = eventsByDay.get(selectedDay) ?? []
    return [...list].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
  }, [eventsByDay, selectedDay])

  const dayButtonComponent = useMemo(
    () =>
      function BoundDayButton(p: React.ComponentProps<typeof DayButton>) {
        return <DashboardCalendarDayButton {...p} eventsByDay={eventsByDay} />
      },
    [eventsByDay],
  )

  return (
    <GlassCard className="max-w-full overflow-x-hidden overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Town calendar
          </span>
          <h2 className="mt-1 font-serif text-lg font-bold text-[color:var(--neon-text0)] md:text-xl">
            This month
          </h2>
          <p className="mt-1 text-sm text-[color:var(--neon-text2)]">
            Published events starting in Virginia/DMV month view (Eastern dates).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/dashboard?cal=${prevKey}`}
            scroll={false}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text0)] backdrop-blur transition-colors hover:bg-[color:var(--neon-a)]/10"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[9rem] rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 px-3 py-2 text-center font-mono text-xs text-[color:var(--neon-text1)] backdrop-blur">
            {calKey}
          </span>
          <Link
            href={`/dashboard?cal=${nextKey}`}
            scroll={false}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text0)] backdrop-blur transition-colors hover:bg-[color:var(--neon-a)]/10"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid max-w-full min-w-0 gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8">
        <div className="flex min-w-0 justify-center lg:justify-start">
          <Calendar
            key={calKey}
            mode="single"
            required
            month={monthDate}
            selected={selectedDate}
            onSelect={(d) => {
              if (d) setSelectedDay(easternPickerDayKey(d))
            }}
            components={{
              DayButton: dayButtonComponent,
            }}
            className="w-full max-w-full rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-2 backdrop-blur [--cell-size:2.25rem] md:max-w-[min(100%,20rem)] md:[--cell-size:2.5rem]"
            classNames={{
              root: "w-full",
              nav: "hidden",
              day: "text-[color:var(--neon-text0)]",
              weekday: "text-[color:var(--neon-text2)]",
              outside: "text-[color:var(--neon-text2)]/50",
              today: "bg-[color:var(--neon-a)]/15 text-[color:var(--neon-text0)]",
              button_next: "border-[color:var(--neon-hairline)] text-[color:var(--neon-text0)]",
              button_previous: "border-[color:var(--neon-hairline)] text-[color:var(--neon-text0)]",
            }}
            modifiers={{
              hasEvent: (d) => eventsByDay.has(easternPickerDayKey(d)),
              eventMany: (d) => (eventsByDay.get(easternPickerDayKey(d))?.length ?? 0) > 3,
            }}
            modifiersClassNames={{
              hasEvent:
                "relative z-0 rounded-lg font-semibold text-[color:var(--neon-text0)] ring-1 ring-[color:color-mix(in_srgb,var(--neon-a)_55%,transparent)] shadow-[0_0_22px_rgba(0,209,255,0.16)] bg-[color:var(--neon-surface)]/30 data-[selected-single=true]:bg-[color:var(--neon-a)]/25 data-[selected-single=true]:text-[color:var(--neon-text0)] data-[selected-single=true]:ring-[color:color-mix(in_srgb,var(--neon-b)_50%,transparent)] data-[selected-single=true]:shadow-[0_0_26px_rgba(168,85,247,0.14)]",
              eventMany:
                "shadow-[0_0_28px_rgba(168,85,247,0.2)] data-[selected-single=true]:shadow-[0_0_32px_rgba(168,85,247,0.22)]",
            }}
          />
        </div>

        <div className="min-w-0 space-y-3">
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-8 text-center backdrop-blur">
              <p className="text-sm text-[color:var(--neon-text1)]">
                No published events with a start date this month yet.
              </p>
              <NeonLink href="/events" className="mt-4 inline-flex" shape="xl">
                Browse all events
              </NeonLink>
            </div>
          ) : (
            <>
              <div className="border-b border-[color:var(--neon-hairline)]/80 pb-3">
                <p className="font-serif text-base font-bold text-[color:var(--neon-text0)] md:text-lg">
                  {formatDashboardDayPanelHeading(selectedDay, selectedEvents.length)}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-text2)]">
                  Day detail
                </p>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-6 text-center backdrop-blur">
                  <p className="text-sm text-[color:var(--neon-text1)]">
                    No events on this day. Pick another date on the calendar.
                  </p>
                </div>
              ) : (
                <ul className="min-w-0 space-y-2">
                  {selectedEvents.map((e) => (
                    <li key={e.id} className="min-w-0">
                      <Link
                        href={`/events/${e.slug}`}
                        className="block min-w-0 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-3 py-3 backdrop-blur transition-[border-color,box-shadow,transform] hover:border-[color:var(--neon-a)]/40 hover:shadow-[0_0_18px_rgb(0_209_255/0.08)] sm:px-4"
                      >
                        <p className="break-words font-semibold text-[color:var(--neon-text0)]">
                          {e.title}
                        </p>
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
                              <Badge
                                key={`${e.id}-${c}`}
                                variant="outline"
                                className="border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 text-[10px] font-medium text-[color:var(--neon-text1)] shadow-[0_0_12px_rgba(0,209,255,0.06)]"
                              >
                                {formatCategoryLabel(c)}
                              </Badge>
                            ))
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 text-[10px] font-medium text-[color:var(--neon-text1)]"
                            >
                              Event
                            </Badge>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
