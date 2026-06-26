import type { DashboardHomeStats, DashboardNextMove } from "@/lib/dashboard/dashboard-home-types"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import { DashboardCalendarShell } from "@/components/dashboard/calendar/dashboard-calendar-shell"
import { DashboardStats } from "@/components/dashboard/home/dashboard-stats"
import { MyNextMoveCard } from "@/components/dashboard/home/my-next-move-card"
import { PlannerSection, type PlannerSectionProps } from "@/components/dashboard/home/planner-section"

export interface DashboardCommandCenterProps {
  displayName: string
  region: string
  isFirstRun: boolean
  firstRunHint: string | null
  stats: DashboardHomeStats
  nextMove: DashboardNextMove
  upcomingPlans: PlannerSectionProps["upcomingPlans"]
  savedUpcoming: PlannerSectionProps["savedUpcoming"]
  ticketEventIds: PlannerSectionProps["ticketEventIds"]
  siteOrigin: PlannerSectionProps["siteOrigin"]
  calendarYear: number
  calendarMonthIndex: number
  calendarKey: string
  calendarEvents: DashboardCalendarEvent[]
  savedEventIds: string[]
}

export function DashboardCommandCenter({
  displayName,
  region,
  isFirstRun,
  firstRunHint,
  stats,
  nextMove,
  upcomingPlans,
  savedUpcoming,
  ticketEventIds,
  siteOrigin,
  calendarYear,
  calendarMonthIndex,
  calendarKey,
  calendarEvents,
  savedEventIds,
}: DashboardCommandCenterProps) {
  const subtext = firstRunHint
    ? firstRunHint
    : region !== "Virginia"
      ? `Here's what's on your radar this week in ${region}.`
      : "Here's what's on your radar this week."

  return (
    <section aria-labelledby="command-center-heading" className="space-y-6">
      <header className="vizb-control-room-header rounded-none border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 px-4 pt-3 pb-5 backdrop-blur md:px-6 md:pt-4 md:pb-5 vizb-motion-enter">
        <span className="font-mono text-sm uppercase tracking-widest text-[color:var(--neon-text2)]">
          Command center · {region}
        </span>
        <h1
          id="command-center-heading"
          className="neon-gradient-text mt-2 text-balance font-serif text-3xl font-bold md:text-4xl"
        >
          {isFirstRun ? "Welcome to ViBE" : "What's the move?"}
        </h1>
        {!isFirstRun && displayName !== "there" ? (
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--neon-a)]">
            {displayName}
          </p>
        ) : null}
        <p className="mt-2 max-w-lg text-base leading-relaxed text-[color:var(--neon-text1)]">
          {subtext}
        </p>
      </header>

      <PlannerSection
        upcomingPlans={upcomingPlans}
        savedUpcoming={savedUpcoming}
        ticketEventIds={ticketEventIds}
        siteOrigin={siteOrigin}
        variant="embedded"
      />

      <section aria-labelledby="dash-calendar-heading" className="scroll-mt-24">
        <h2 id="dash-calendar-heading" className="sr-only">
          Town calendar planner
        </h2>
        <DashboardCalendarShell
          key={calendarKey}
          year={calendarYear}
          monthIndex={calendarMonthIndex}
          calKey={calendarKey}
          events={calendarEvents}
          savedEventIds={savedEventIds}
        />
      </section>

      <MyNextMoveCard nextMove={nextMove} />

      <DashboardStats stats={stats} />
    </section>
  )
}
