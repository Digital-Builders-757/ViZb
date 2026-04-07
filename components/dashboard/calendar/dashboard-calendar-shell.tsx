"use client"

import { useEffect, useMemo, useState } from "react"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import {
  agendaDayKeysFromToday,
  defaultSelectedDayKey,
  defaultSelectedDayKeyInSet,
  easternDateKey,
} from "@/lib/events/dashboard-calendar"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { DashboardCalendarAgenda } from "./dashboard-calendar-agenda"
import { DashboardCalendarDayPanel } from "./dashboard-calendar-day-panel"
import { DashboardCalendarEventDetail } from "./dashboard-calendar-event-detail"
import { DashboardCalendarMonth } from "./dashboard-calendar-month"
import { DashboardCalendarWeek } from "./dashboard-calendar-week"

export type DashboardCalendarView = "month" | "week" | "agenda"

export interface DashboardCalendarShellProps {
  year: number
  monthIndex: number
  calKey: string
  events: DashboardCalendarEvent[]
}

export function DashboardCalendarShell({
  year,
  monthIndex,
  calKey,
  events,
}: DashboardCalendarShellProps) {
  const [view, setView] = useState<DashboardCalendarView>("month")
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [isLg, setIsLg] = useState(true)

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

  const defaultDay = useMemo(
    () => defaultSelectedDayKey(year, monthIndex, eventsByDay),
    [year, monthIndex, eventsByDay],
  )

  const [selectedDayKey, setSelectedDayKey] = useState(defaultDay)
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const apply = () => setIsLg(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  function changeView(next: DashboardCalendarView) {
    setView(next)
    if (next === "agenda") {
      const keys = agendaDayKeysFromToday()
      setSelectedDayKey((prev) =>
        keys.includes(prev) ? prev : defaultSelectedDayKeyInSet(keys, eventsByDay),
      )
    }
  }

  function selectDay(key: string) {
    setSelectedDayKey(key)
    setSelectedEventId(undefined)
    setDetailSheetOpen(false)
  }

  function selectEvent(id: string) {
    setSelectedEventId(id)
    if (!isLg) setDetailSheetOpen(true)
  }

  function clearEvent() {
    setSelectedEventId(undefined)
    setDetailSheetOpen(false)
  }

  const selectedEvents = useMemo(() => {
    const list = eventsByDay.get(selectedDayKey) ?? []
    return [...list].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
  }, [eventsByDay, selectedDayKey])

  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((e) => e.id === selectedEventId) : undefined),
    [events, selectedEventId],
  )

  const panelContent =
    events.length === 0 ? (
      <div className="rounded-xl border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-8 text-center backdrop-blur">
        <p className="text-sm text-[color:var(--neon-text1)]">
          No published events with a start date this month yet.
        </p>
        <NeonLink href="/events" className="mt-4 inline-flex" shape="xl">
          Browse all events
        </NeonLink>
      </div>
    ) : selectedEvent ? (
      <DashboardCalendarEventDetail event={selectedEvent} onBack={clearEvent} />
    ) : (
      <DashboardCalendarDayPanel
        dayKey={selectedDayKey}
        events={selectedEvents}
        onSelectEvent={selectEvent}
      />
    )

  const viewButtons: { id: DashboardCalendarView; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "agenda", label: "Agenda" },
  ]

  return (
    <GlassCard className="max-w-full overflow-x-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Town calendar
          </span>
          <h2 className="mt-1 font-serif text-lg font-bold text-[color:var(--neon-text0)] md:text-xl">
            Planner
          </h2>
          <p className="mt-1 text-sm text-[color:var(--neon-text2)]">
            Scan the month, plan the week, or browse what&apos;s next (Eastern dates).
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Calendar view"
          className="flex shrink-0 flex-wrap gap-1 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-1 backdrop-blur"
        >
          {viewButtons.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              aria-controls="dashboard-calendar-panel"
              id={`cal-tab-${id}`}
              className={cn(
                "rounded-lg px-3 py-2 font-mono text-xs uppercase tracking-wide transition-[background,box-shadow,color]",
                view === id
                  ? "border border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] bg-[color:var(--neon-a)]/20 text-[color:var(--neon-text0)] shadow-[0_0_16px_rgba(0,209,255,0.14)]"
                  : "border border-transparent text-[color:var(--neon-text2)] hover:border-[color:var(--neon-hairline)] hover:bg-[color:var(--neon-surface)]/25 hover:text-[color:var(--neon-text0)]",
              )}
              onClick={() => changeView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-col lg:grid lg:min-h-[420px] lg:grid-cols-[minmax(0,1fr)_min(22rem,36vw)] lg:gap-0">
        <div
          id="dashboard-calendar-panel"
          role="tabpanel"
          aria-labelledby={`cal-tab-${view}`}
          className="min-w-0 border-[color:var(--neon-hairline)] p-4 sm:p-5 lg:border-r"
        >
          {view === "month" ? (
            <DashboardCalendarMonth
              year={year}
              monthIndex={monthIndex}
              calKey={calKey}
              eventsByDay={eventsByDay}
              selectedDayKey={selectedDayKey}
              onSelectDay={selectDay}
            />
          ) : null}
          {view === "week" ? (
            <DashboardCalendarWeek
              eventsByDay={eventsByDay}
              selectedDayKey={selectedDayKey}
              onSelectDay={selectDay}
              onSelectEvent={selectEvent}
            />
          ) : null}
          {view === "agenda" ? (
            <DashboardCalendarAgenda
              eventsByDay={eventsByDay}
              selectedDayKey={selectedDayKey}
              onSelectDay={selectDay}
              onSelectEvent={selectEvent}
            />
          ) : null}
        </div>

        <aside
          className="hidden min-h-0 min-w-0 flex-col p-4 sm:p-5 lg:flex lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
          aria-label="Event details"
        >
          {panelContent}
        </aside>
      </div>

      {events.length === 0 ? (
        <div className="border-t border-[color:var(--neon-hairline)] p-4 sm:p-5 lg:hidden">{panelContent}</div>
      ) : !selectedEvent ? (
        <div className="border-t border-[color:var(--neon-hairline)] p-4 sm:p-5 lg:hidden">
          <DashboardCalendarDayPanel
            dayKey={selectedDayKey}
            events={selectedEvents}
            onSelectEvent={selectEvent}
          />
        </div>
      ) : null}

      <Sheet
        open={!!selectedEvent && detailSheetOpen && !isLg}
        onOpenChange={(open) => {
          setDetailSheetOpen(open)
          if (!open) clearEvent()
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[min(90vh,640px)] overflow-y-auto border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]"
        >
          <SheetTitle className="sr-only">Event details</SheetTitle>
          {selectedEvent ? (
            <DashboardCalendarEventDetail event={selectedEvent} onBack={clearEvent} />
          ) : null}
        </SheetContent>
      </Sheet>
    </GlassCard>
  )
}
