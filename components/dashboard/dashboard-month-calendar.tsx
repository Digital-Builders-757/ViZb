"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { easternDateKey, shiftCalKey } from "@/lib/events/dashboard-calendar"
import { formatCategoryLabels, formatDashboardEventWhen } from "@/lib/events/event-display-format"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

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

export function DashboardMonthCalendar({
  year,
  monthIndex,
  calKey,
  events,
}: DashboardMonthCalendarProps) {
  const monthDate = useMemo(() => new Date(year, monthIndex, 1), [year, monthIndex])
  const prevKey = shiftCalKey(year, monthIndex, -1)
  const nextKey = shiftCalKey(year, monthIndex, 1)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

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

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
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
        <div className="flex items-center gap-2 shrink-0">
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

      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8">
        <div className="flex justify-center lg:justify-start">
          <Calendar
            key={calKey}
            defaultMonth={monthDate}
            className="rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-2 backdrop-blur [--cell-size:2.25rem] md:[--cell-size:2.5rem]"
            classNames={{
              root: "w-full max-w-[min(100%,20rem)]",
              nav: "hidden",
              day: "text-[color:var(--neon-text0)]",
              weekday: "text-[color:var(--neon-text2)]",
              outside: "text-[color:var(--neon-text2)]/50",
              today: "bg-[color:var(--neon-a)]/15 text-[color:var(--neon-text0)]",
              button_next: "border-[color:var(--neon-hairline)] text-[color:var(--neon-text0)]",
              button_previous: "border-[color:var(--neon-hairline)] text-[color:var(--neon-text0)]",
            }}
            modifiers={{
              hasEvent: (d) => {
                const key = easternPickerDayKey(d)
                return eventsByDay.has(key)
              },
            }}
            modifiersClassNames={{
              hasEvent:
                "relative font-semibold text-[color:var(--neon-a)] after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[color:var(--neon-a)] after:content-[''] data-[selected-single=true]:after:bg-[color:var(--neon-text0)]",
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
            <ul className="space-y-2">
              {events.map((e) => {
                const dayKey = easternDateKey(e.starts_at)
                const active = hoveredDay === dayKey
                return (
                  <li key={e.id}>
                    <Link
                      href={`/events/${e.slug}`}
                      className={`block rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-3 py-3 backdrop-blur transition-[border-color,box-shadow,transform] sm:px-4 ${
                        active
                          ? "border-[color:var(--neon-a)]/35 shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_14%,transparent),0_0_26px_rgb(0_209_255/0.12)]"
                          : "hover:border-[color:var(--neon-a)]/40 hover:shadow-[0_0_18px_rgb(0_209_255/0.08)]"
                      }`}
                      onMouseEnter={() => setHoveredDay(dayKey)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onFocus={() => setHoveredDay(dayKey)}
                      onBlur={() => setHoveredDay(null)}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)]">
                          {dayKey}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-text2)]">
                          {formatCategoryLabels(e.categories)}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-[color:var(--neon-text0)]">{e.title}</p>
                      <p className="mt-0.5 text-sm text-[color:var(--neon-text1)]">
                        {e.city} · {e.venue_name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[color:var(--neon-text2)]">
                        {formatDashboardEventWhen(e.starts_at, e.ends_at)}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
