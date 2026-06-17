import Link from "next/link"
import { CalendarPlus } from "lucide-react"
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

  const Wrapper = variant === "embedded" ? "div" : "section"
  const wrapperProps =
    variant === "embedded"
      ? {
          id: "my-vibes-week-heading",
          "aria-labelledby": "planner-heading",
          className: "scroll-mt-24 space-y-5",
        }
      : {
          id: "my-vibes-week-heading",
          "aria-labelledby": "planner-heading",
          className: "scroll-mt-24 space-y-5",
        }

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={
          variant === "embedded"
            ? "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
            : "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        }
      >
        <div id="planner-heading">
          <SectionTitle kicker="Your week" title="Locked in & on your radar" />
        </div>
        <a
          href="/api/calendar/ics?myVibes=1"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-none border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] hover:border-[color:var(--neon-a)]/45"
        >
          <CalendarPlus className="h-4 w-4 text-[color:var(--neon-a)]" aria-hidden />
          Add to calendar
        </a>
      </div>

      <PlannerWeekPreview upcomingPlans={upcomingPlans} savedUpcoming={savedUpcoming} />

      {!hasContent ? (
        <DashboardEmptyState
          kicker="No plans yet"
          title="Nothing locked in yet"
          description="RSVP or save events from the timeline — they'll land here as your personal command map."
        >
          <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
            Browse events
          </NeonLink>
        </DashboardEmptyState>
      ) : (
        <div className="space-y-6">
          {upcomingPlans.length > 0 ? (
            <div>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--neon-a)]">
                Locked in
              </h3>
              <ul className="space-y-3">
                {upcomingPlans.map((plan) => (
                  <li key={plan.ticketId}>{plannerRowFromTicket(plan, siteOrigin)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {savedOnly.length > 0 ? (
            <div>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--neon-b)]">
                On your radar
              </h3>
              <ul className="space-y-3">
                {savedOnly.map((ev) => (
                  <li key={ev.id}>{plannerRowFromSaved(ev, siteOrigin, false)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Waitlisted events — not available yet. Save or RSVP to track moves here.
          </p>
        </div>
      )}

      <Link
        href="/events"
        className="inline-block font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] underline-offset-4 hover:underline"
      >
        Open full timeline →
      </Link>
    </Wrapper>
  )
}
