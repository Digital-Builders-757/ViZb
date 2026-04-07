"use client"

import { useMemo } from "react"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import {
  addCalendarDaysToDayKey,
  formatWeekStripRangeLabel,
  weekDayKeysSundayStart,
} from "@/lib/events/dashboard-calendar"
import { formatDashboardEventTimeShort } from "@/lib/events/event-display-format"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_VISIBLE = 3

export interface DashboardCalendarWeekProps {
  eventsByDay: Map<string, DashboardCalendarEvent[]>
  selectedDayKey: string
  onSelectDay: (dayKey: string) => void
  onSelectEvent: (eventId: string) => void
}

function dayColumnLabel(dayKey: string): { dow: string; dom: string } {
  const [y, m, d] = dayKey.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const dow = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)
  const dom = String(d)
  return { dow, dom }
}

export function DashboardCalendarWeek({
  eventsByDay,
  selectedDayKey,
  onSelectDay,
  onSelectEvent,
}: DashboardCalendarWeekProps) {
  const weekKeys = useMemo(() => weekDayKeysSundayStart(selectedDayKey), [selectedDayKey])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          Week · {formatWeekStripRangeLabel(weekKeys[0], weekKeys[6])}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text0)] backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:shadow-[0_0_14px_rgb(0_209_255/0.1)]"
            aria-label="Previous week"
            onClick={() => onSelectDay(addCalendarDaysToDayKey(selectedDayKey, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text0)] backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:shadow-[0_0_14px_rgb(0_209_255/0.1)]"
            aria-label="Next week"
            onClick={() => onSelectDay(addCalendarDaysToDayKey(selectedDayKey, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
        {weekKeys.map((dayKey) => {
          const { dow, dom } = dayColumnLabel(dayKey)
          const events = [...(eventsByDay.get(dayKey) ?? [])].sort(
            (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
          )
          const isSelected = dayKey === selectedDayKey
          const visible = events.slice(0, MAX_VISIBLE)
          const rest = events.length - visible.length

          return (
            <div
              key={dayKey}
              className={cn(
                "flex min-w-0 flex-col gap-1.5 rounded-xl border p-1.5 sm:p-2",
                isSelected
                  ? "border-[color:color-mix(in_srgb,var(--neon-a)_50%,var(--neon-hairline))] bg-[color:var(--neon-surface)]/35 shadow-[0_0_20px_rgba(0,209,255,0.12)]"
                  : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(dayKey)}
                className={cn(
                  "rounded-lg px-1 py-1 text-left transition-[box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--neon-bg0)]",
                  "hover:shadow-[0_0_12px_rgba(0,209,255,0.08)]",
                )}
                aria-pressed={isSelected}
                aria-label={`Select ${dow} ${dom}`}
              >
                <span className="block font-mono text-[9px] uppercase tracking-wide text-[color:var(--neon-text2)]">
                  {dow}
                </span>
                <span className="block font-serif text-sm font-bold text-[color:var(--neon-text0)]">{dom}</span>
              </button>

              <div className="flex min-w-0 flex-col gap-1">
                {visible.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      onSelectDay(dayKey)
                      onSelectEvent(e.id)
                    }}
                    className="min-w-0 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/40 px-1.5 py-1 text-left text-[10px] leading-snug text-[color:var(--neon-text0)] backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] hover:shadow-[0_0_12px_rgb(0_209_255/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] sm:text-xs"
                  >
                    <span className="line-clamp-2 font-medium">{e.title}</span>
                    <span className="mt-0.5 block font-mono text-[9px] text-[color:var(--neon-a)]">
                      {formatDashboardEventTimeShort(e.starts_at, e.ends_at)}
                    </span>
                  </button>
                ))}

                {rest > 0 ? (
                  <button
                    type="button"
                    className="rounded-lg px-1 py-1 text-center font-mono text-[9px] font-semibold text-[color:var(--neon-b)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-b)]"
                    onClick={() => {
                      onSelectDay(dayKey)
                      const next = events[MAX_VISIBLE]
                      if (next) onSelectEvent(next.id)
                    }}
                  >
                    +{rest} more
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
