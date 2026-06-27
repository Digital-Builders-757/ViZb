"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, LayoutGrid, ListChecks, Rows3, Sparkles } from "lucide-react"
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
  /** Event IDs the member saved (My Vibes); powers calendar detail save control. */
  savedEventIds?: string[]
}

export function DashboardCalendarShell({
  year,
  monthIndex,
  calKey,
  events,
  savedEventIds = [],
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
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({})

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

  function setEventSaved(eventId: string, nextSaved: boolean) {
    setSavedOverrides((prev) => ({ ...prev, [eventId]: nextSaved }))
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

  const savedSet = useMemo(() => new Set(savedEventIds), [savedEventIds])
  const activeDayCount = eventsByDay.size

  const isSavedLive = (id: string) => (id in savedOverrides ? savedOverrides[id] : savedSet.has(id))

  const panelContent =
    events.length === 0 ? (
      <div className="rounded-lg border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-8 text-center backdrop-blur">
        <p className="text-base text-[color:var(--neon-text1)]">
          No published events with a start date this month yet.
        </p>
        <NeonLink href="/events" className="mt-4 inline-flex" shape="xl">
          Browse all events
        </NeonLink>
      </div>
    ) : selectedEvent ? (
      <DashboardCalendarEventDetail
        event={selectedEvent}
        onBack={clearEvent}
        initialSaved={isSavedLive(selectedEvent.id)}
        onSavedChange={(next) => setEventSaved(selectedEvent.id, next)}
      />
    ) : (
      <DashboardCalendarDayPanel
        dayKey={selectedDayKey}
        events={selectedEvents}
        onSelectEvent={selectEvent}
        isSavedEvent={isSavedLive}
        onSavedChange={setEventSaved}
      />
    )

  const viewButtons = [
    { id: "month" as const, label: "Month", icon: LayoutGrid },
    { id: "week" as const, label: "Week", icon: Rows3 },
    { id: "agenda" as const, label: "Agenda", icon: ListChecks },
  ]

  return (
    <GlassCard className="planner-tide-panel max-w-full overflow-hidden rounded-lg p-0">
      <div className="relative border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/30 px-4 py-5 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-text2)] sm:text-sm">
              <CalendarDays className="h-4 w-4 text-[color:var(--neon-a)]" aria-hidden />
              Town calendar - Eastern dates
            </span>
            <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-[color:var(--neon-text0)] md:text-3xl">
              Planner
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--neon-text1)] sm:text-base">
              Scan the month, compare the week, and open the details before you pick the move.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[25rem]">
            {[
              { label: "Month moves", value: events.length },
              { label: "Active days", value: activeDayCount },
              { label: "Saved", value: savedEventIds.length },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/24 px-3 py-2.5"
              >
                <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
                  {label}
                </p>
                <p className="mt-0.5 font-serif text-xl font-bold text-[color:var(--neon-text0)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-sm text-[color:var(--neon-text2)]">
            <Sparkles className="h-4 w-4 text-[color:var(--neon-b)]" aria-hidden />
            {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"} on the selected day
          </p>
          <div
            role="tablist"
            aria-label="Calendar view"
            className="grid shrink-0 grid-cols-3 gap-1 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-1 backdrop-blur"
          >
            {viewButtons.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                aria-controls="dashboard-calendar-panel"
                id={`cal-tab-${id}`}
                className={cn(
                  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 font-mono text-xs uppercase tracking-normal transition-[background,border-color,box-shadow,color]",
                  view === id
                    ? "border-[color:color-mix(in_srgb,var(--neon-a)_44%,var(--neon-hairline))] bg-[color:var(--neon-a)]/18 text-[color:var(--neon-text0)] shadow-[0_0_16px_rgba(0,209,255,0.14)]"
                    : "border-transparent text-[color:var(--neon-text2)] hover:border-[color:var(--neon-hairline)] hover:bg-[color:var(--neon-surface)]/25 hover:text-[color:var(--neon-text0)]",
                )}
                onClick={() => changeView(id)}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col lg:grid lg:min-h-[480px] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:gap-0">
        <div
          id="dashboard-calendar-panel"
          role="tabpanel"
          aria-labelledby={`cal-tab-${view}`}
          className="min-w-0 border-[color:var(--neon-hairline)] p-3 sm:p-5 lg:border-r lg:p-6"
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
              isSavedEvent={isSavedLive}
              onSavedChange={setEventSaved}
            />
          ) : null}
        </div>

        <aside
          className="hidden min-h-0 min-w-0 flex-col bg-[color:var(--neon-bg1)]/18 p-4 sm:p-5 lg:flex lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
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
            isSavedEvent={isSavedLive}
            onSavedChange={setEventSaved}
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
            <DashboardCalendarEventDetail
              event={selectedEvent}
              onBack={clearEvent}
              initialSaved={isSavedLive(selectedEvent.id)}
              onSavedChange={(next) => setEventSaved(selectedEvent.id, next)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </GlassCard>
  )
}
