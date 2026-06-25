import Link from "next/link"

import type { MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

interface MemberHomeTicketsSectionProps {
  loadError: string | null
  upcomingPreviews: MemberHomeTicketPreview[]
  upcomingCount: number
  pastCount: number
}

import { formatEventDateTimeCompact } from "@/lib/events/event-display-format"

function formatTicketWhen(iso: string) {
  return `${formatEventDateTimeCompact(iso)} ET`
}

export function MemberHomeTicketsSection({
  loadError,
  upcomingPreviews,
  upcomingCount,
  pastCount,
}: MemberHomeTicketsSectionProps) {
  const hasPastOnly = !loadError && upcomingCount === 0 && pastCount > 0

  return (
    <section aria-labelledby="tickets-heading">
      <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
        My Tickets
      </span>
      <h2
        id="tickets-heading"
        className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)]"
      >
        Active tickets
      </h2>
      <p className="mt-1 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text2)]">
        RSVPs and purchases for events that have not ended yet. Past tickets stay in your{" "}
        <Link href="/tickets#history" className="text-[color:var(--neon-a)] underline-offset-4 hover:underline">
          ticket history
        </Link>
        .
      </p>

      {loadError ? (
        <GlassCard className="mt-6 p-4">
          <p className="text-sm text-amber-200/90">{loadError}</p>
          <p className="mt-2 text-xs text-[color:var(--neon-text2)]">
            Apply{" "}
            <span className="font-mono">scripts/025_create_event_registrations.sql</span> and{" "}
            <span className="font-mono">scripts/028_tickets_core_free_rsvp.sql</span> (or matching
            migrations) to enable RSVP and tickets.
          </p>
        </GlassCard>
      ) : null}

      {!loadError && upcomingCount === 0 && pastCount === 0 ? (
        <EmptyStateCard
          className="mt-6"
          kicker="No tickets yet"
          title="RSVP or buy on an event page"
          description="Pick a published event, RSVP free or finish paid checkout, and it will show here and on My Tickets."
        >
          <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
            Browse events
          </NeonLink>
        </EmptyStateCard>
      ) : null}

      {hasPastOnly ? (
        <EmptyStateCard
          className="mt-6"
          kicker="No active tickets"
          title="Your past tickets are saved"
          description={`You have ${pastCount} ticket${pastCount === 1 ? "" : "s"} in history from events you've already attended.`}
        >
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <NeonLink href="/tickets#history" fullWidth className="sm:w-auto" shape="xl">
              View ticket history
            </NeonLink>
            <NeonLink href="/events" variant="secondary" fullWidth className="sm:w-auto" shape="xl">
              Browse events
            </NeonLink>
          </div>
        </EmptyStateCard>
      ) : null}

      {!loadError && upcomingPreviews.length > 0 ? (
        <div className="mt-6 space-y-3">
          {upcomingPreviews.map((row) => (
            <Link key={row.registrationKey} href={`/tickets/${row.ticketId}`} className="block min-w-0">
              <GlassCard className="p-4 transition-colors hover:border-[color:var(--neon-text2)]/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                      {formatTicketWhen(row.startsAt)}
                    </p>
                    <h3 className="mt-1 truncate font-serif text-lg font-bold text-[color:var(--neon-text0)]">
                      {row.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-[color:var(--neon-text1)]">
                      {row.venueName} • {row.city}
                    </p>
                  </div>
                  <span className="shrink-0 border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/50 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
                    {row.status === "checked_in" ? "Checked in" : "Confirmed"}
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}

          {upcomingCount > upcomingPreviews.length ? (
            <div className="pt-1">
              <NeonLink href="/tickets" variant="secondary" shape="xl" className="w-full sm:w-auto">
                View all {upcomingCount} on My Tickets
              </NeonLink>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <NeonLink href="/tickets" variant="secondary" shape="xl" className="w-full sm:w-auto">
                Open My Tickets
              </NeonLink>
              {pastCount > 0 ? (
                <Link
                  href="/tickets#history"
                  className="text-center text-sm text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline sm:text-left"
                >
                  {pastCount} in history
                </Link>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
