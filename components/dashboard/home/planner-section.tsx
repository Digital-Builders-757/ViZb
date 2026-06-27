import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, Bookmark, CalendarPlus, CheckCircle2, Sparkles } from "lucide-react"
import type { MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import type { MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import { SectionTitle } from "@/components/ui/section-title"
import { NeonLink } from "@/components/ui/neon-link"
import { DashboardEmptyState } from "@/components/dashboard/home/dashboard-empty-state"
import { PlannerWeekPreview } from "@/components/dashboard/home/planner-week-preview"
import { plannerRowFromSaved, plannerRowFromTicket } from "@/components/dashboard/home/planner-event-row"

export interface PlannerSectionProps {
  upcomingPlans: MemberHomeTicketPreview[]
  savedUpcoming: MyVibesEventRow[]
  ticketEventIds: string[]
  siteOrigin: string
  variant?: "standalone" | "embedded"
}

function PlannerLaneHeader({
  icon,
  label,
  count,
  tone,
}: {
  icon: ReactNode
  label: string
  count: number
  tone: "cyan" | "violet"
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3
        className={
          tone === "cyan"
            ? "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)]"
            : "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-b)]"
        }
      >
        {icon}
        {label}
      </h3>
      <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-2.5 py-1 font-mono text-[10px] text-[color:var(--neon-text2)]">
        {count}
      </span>
    </div>
  )
}

export function PlannerSection({
  upcomingPlans,
  savedUpcoming,
  ticketEventIds,
  siteOrigin,
  variant = "standalone",
}: PlannerSectionProps) {
  const ticketIdSet = new Set(ticketEventIds)
  const savedOnly = savedUpcoming.filter((e) => !ticketIdSet.has(e.id))
  const hasContent = upcomingPlans.length > 0 || savedOnly.length > 0
  const uniqueTotal = new Set([
    ...upcomingPlans.map((p) => p.eventId),
    ...savedUpcoming.map((event) => event.id),
  ]).size

  const Wrapper = variant === "embedded" ? "div" : "section"
  const wrapperProps = {
    id: "my-vibes-week-heading",
    "aria-labelledby": "planner-heading",
    className: "scroll-mt-24 space-y-5",
  }

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div id="planner-heading">
          <SectionTitle kicker="Your night board" title="Locked in and worth watching" />
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--neon-text1)]">
            Keep the tickets, saves, invites, and maybes in one clean place before the night moves.
          </p>
        </div>
        <a
          href="/api/calendar/ics?myVibes=1"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-4 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-a)]/45 hover:bg-[color:var(--neon-surface)]/55"
        >
          <CalendarPlus className="h-4 w-4 text-[color:var(--neon-a)]" aria-hidden />
          Sync My Vibes
        </a>
      </div>

      {!hasContent ? (
        <DashboardEmptyState
          kicker="No plans yet"
          title="Nothing locked in yet"
          description="RSVP or save events from the timeline. They will land here as your personal night board."
        >
          <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
            Browse events
          </NeonLink>
        </DashboardEmptyState>
      ) : (
        <div className="planner-tide-panel overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 p-4 backdrop-blur sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Locked", value: upcomingPlans.length, icon: CheckCircle2 },
              { label: "Radar", value: savedOnly.length, icon: Bookmark },
              { label: "This board", value: uniqueTotal, icon: Sparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/35 px-3 py-3"
              >
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
                  <Icon className="h-3.5 w-3.5 text-[color:var(--neon-a)]" aria-hidden />
                  {label}
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-[color:var(--neon-text0)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <PlannerWeekPreview upcomingPlans={upcomingPlans} savedUpcoming={savedUpcoming} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div>
              <PlannerLaneHeader
                icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                label="Locked in"
                count={upcomingPlans.length}
                tone="cyan"
              />
              {upcomingPlans.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingPlans.map((plan) => (
                    <li key={plan.ticketId}>{plannerRowFromTicket(plan, siteOrigin)}</li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-5 text-sm leading-relaxed text-[color:var(--neon-text1)]">
                  Nothing ticketed yet. Lock in a plan when the event is a must-go.
                </div>
              )}
            </div>

            <div>
              <PlannerLaneHeader
                icon={<Bookmark className="h-4 w-4" aria-hidden />}
                label="On your radar"
                count={savedOnly.length}
                tone="violet"
              />
              {savedOnly.length > 0 ? (
                <ul className="space-y-3">
                  {savedOnly.map((ev) => (
                    <li key={ev.id}>{plannerRowFromSaved(ev, siteOrigin, false)}</li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-4 py-5 text-sm leading-relaxed text-[color:var(--neon-text1)]">
                  No maybes parked here. Save events you want to compare before you commit.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--neon-hairline)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--neon-text2)]">
              Your saved and ticketed events can export together, so the plan follows you outside VIZB.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)] underline-offset-4 hover:underline"
            >
              Open full timeline
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </Wrapper>
  )
}
