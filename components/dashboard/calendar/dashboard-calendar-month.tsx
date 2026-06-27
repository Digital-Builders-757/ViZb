"use client"

import Link from "next/link"
import { useMemo } from "react"
import { DayButton } from "react-day-picker"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { dateFromDayKey, shiftCalKey } from "@/lib/events/dashboard-calendar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

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

function monthDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number)
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d))
}

const plannerDayButtonClassName = cn(
  "planner-day-cell focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--neon-bg0)]",
  "relative isolate h-full w-full max-w-none cursor-pointer flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg p-0 leading-none transition-[background,border-color,box-shadow,color]",
  "hover:bg-[color:var(--neon-surface)]/45 hover:shadow-[0_0_18px_rgba(0,209,255,0.12)] active:bg-[color:var(--neon-a)]/18",
  "[&>span]:opacity-100",
)

function DashboardCalendarDayButtonInner({
  eventsByDay,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  eventsByDay: Map<string, DashboardCalendarEvent[]>
}) {
  const { day } = props
  const key = easternPickerDayKey(day.date)
  const count = eventsByDay.get(key)?.length ?? 0
  const ariaLabel =
    count > 0
      ? `Select ${monthDayLabel(key)}, ${count} event${count === 1 ? "" : "s"}`
      : `Select ${monthDayLabel(key)}, no events`

  return (
    <CalendarDayButton
      {...props}
      aria-label={ariaLabel}
      className={cn(plannerDayButtonClassName, props.className)}
    >
      <span className="planner-day-cell-date text-sm font-medium tabular-nums">{day.date.getDate()}</span>
      {count > 0 ? (
        <span className="flex min-h-[0.375rem] items-center justify-center gap-0.5" aria-hidden>
          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
            <span
              key={i}
              className="h-1 w-1 shrink-0 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_8px_rgba(0,209,255,0.75)]"
            />
          ))}
          {count > 3 ? (
            <span className="planner-day-cell-more pl-0.5 text-[10px] font-bold leading-none text-[color:var(--neon-b)]">
              +
            </span>
          ) : null}
        </span>
      ) : null}
    </CalendarDayButton>
  )
}

export interface DashboardCalendarMonthProps {
  year: number
  monthIndex: number
  calKey: string
  eventsByDay: Map<string, DashboardCalendarEvent[]>
  selectedDayKey: string
  onSelectDay: (dayKey: string) => void
}

export function DashboardCalendarMonth({
  year,
  monthIndex,
  calKey,
  eventsByDay,
  selectedDayKey,
  onSelectDay,
}: DashboardCalendarMonthProps) {
  const monthDate = useMemo(() => new Date(year, monthIndex, 1), [year, monthIndex])
  const prevKey = shiftCalKey(year, monthIndex, -1)
  const nextKey = shiftCalKey(year, monthIndex, 1)
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate),
    [monthDate],
  )
  const activeDays = eventsByDay.size

  const selectedDate = useMemo(() => dateFromDayKey(selectedDayKey), [selectedDayKey])
  const selectedEventCount = eventsByDay.get(selectedDayKey)?.length ?? 0

  const dayButtonComponent = useMemo(
    () =>
      function BoundDayButton(p: React.ComponentProps<typeof DayButton>) {
        return <DashboardCalendarDayButtonInner {...p} eventsByDay={eventsByDay} />
      },
    [eventsByDay],
  )

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
            Month view
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold leading-tight text-[color:var(--neon-text0)] sm:text-2xl">
            {monthLabel}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/dashboard?cal=${prevKey}`}
            scroll={false}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text0)] backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:shadow-[0_0_18px_rgb(0_209_255/0.12)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[8rem] rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 px-3 py-2 text-center font-mono text-xs text-[color:var(--neon-text1)] backdrop-blur">
            {activeDays} active day{activeDays === 1 ? "" : "s"}
          </span>
          <Link
            href={`/dashboard?cal=${nextKey}`}
            scroll={false}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text0)] backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:shadow-[0_0_18px_rgb(0_209_255/0.12)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="planner-tide-row rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-3 py-3 backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
            Selected day
          </p>
          <p className="mt-1 font-serif text-lg font-bold leading-tight text-[color:var(--neon-text0)]">
            {monthDayLabel(selectedDayKey)}
          </p>
        </div>
        <div className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--neon-a)]/35 bg-[color:var(--neon-a)]/12 px-3 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)] sm:mt-0">
          <span className="text-base font-bold leading-none">{selectedEventCount}</span>
          <span>
            move{selectedEventCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="dashboard-planner-calendar flex min-w-0 justify-center sm:justify-start">
        <Calendar
          key={calKey}
          mode="single"
          required
          month={monthDate}
          selected={selectedDate}
          onSelect={(d) => {
            if (d) onSelectDay(easternPickerDayKey(d))
          }}
          formatters={{
            formatWeekdayName: (date) =>
              date.toLocaleDateString("en-US", { weekday: "short" }),
          }}
          components={{
            DayButton: dayButtonComponent,
          }}
          className="w-full max-w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-2 backdrop-blur sm:p-3 md:max-w-[min(100%,30rem)]"
          classNames={{
            root: "w-full",
            nav: "hidden",
            month_grid: "w-full table-fixed border-collapse",
            weekdays: "rdp-weekdays",
            weekday:
              "w-[14.285714%] py-2 text-center font-mono text-xs uppercase tracking-normal text-[color:var(--neon-text2)] select-none sm:text-sm",
            week: "rdp-week",
            day: "relative w-[14.285714%] p-1 text-center align-middle text-[color:var(--neon-text0)]",
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
    </div>
  )
}
