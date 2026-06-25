"use client"

import Link from "next/link"
import { QrCode } from "lucide-react"
import type { MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { SectionTitle } from "@/components/ui/section-title"
import { DashboardEmptyState } from "@/components/dashboard/home/dashboard-empty-state"

import { formatEventDateTimeCompact } from "@/lib/events/event-display-format"

function formatTicketWhen(iso: string) {
  return `${formatEventDateTimeCompact(iso)} ET`
}

export interface TicketPassesSectionProps {
  loadError: string | null
  upcomingPreviews: MemberHomeTicketPreview[]
  upcomingCount: number
  pastCount: number
  ticketSigningConfigured: boolean
}

export function TicketPassesSection({
  loadError,
  upcomingPreviews,
  upcomingCount,
  pastCount,
  ticketSigningConfigured,
}: TicketPassesSectionProps) {
  const hasPastOnly = !loadError && upcomingCount === 0 && pastCount > 0

  return (
    <section aria-labelledby="tickets-passes-heading" className="space-y-5">
      <SectionTitle kicker="Tickets & passes" title="Your active passes" />

      {loadError ? (
        <GlassCard className="rounded-none p-4">
          <p className="text-sm text-amber-200/90">{loadError}</p>
        </GlassCard>
      ) : null}

      {!loadError && upcomingCount === 0 && pastCount === 0 ? (
        <DashboardEmptyState
          kicker="No tickets yet"
          title="Find your next move"
          description="RSVP or buy on an event page — your pass shows up here with check-in ready when doors open."
        >
          <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
            Browse events
          </NeonLink>
        </DashboardEmptyState>
      ) : null}

      {hasPastOnly ? (
        <DashboardEmptyState
          kicker="No active tickets"
          title="Your past tickets are saved"
          description={`You have ${pastCount} ticket${pastCount === 1 ? "" : "s"} in history.`}
        >
          <NeonLink href="/tickets#history" fullWidth className="sm:w-auto" shape="xl">
            View ticket history
          </NeonLink>
        </DashboardEmptyState>
      ) : null}

      {!loadError && upcomingPreviews.length > 0 ? (
        <div className="space-y-3">
          {upcomingPreviews.map((row) => (
            <Link key={row.registrationKey} href={`/tickets/${row.ticketId}`} className="block min-w-0">
              <GlassCard className="rounded-none p-4 transition-colors hover:border-[color:var(--neon-a)]/35">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      {formatTicketWhen(row.startsAt)}
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-bold text-[color:var(--neon-text0)]">
                      {row.title}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                      {row.venueName} · {row.city}
                    </p>
                    <span className="mt-2 inline-flex rounded-none border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)]">
                      {row.status === "checked_in" ? "Checked in" : "Confirmed"}
                    </span>
                  </div>
                  <div
                    className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-none border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/40"
                    aria-hidden={ticketSigningConfigured}
                  >
                    <QrCode className="h-8 w-8 text-[color:var(--neon-a)]/70" />
                    <span className="mt-1 font-mono text-[8px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      {ticketSigningConfigured ? "Tap for QR" : "QR soon"}
                    </span>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                  View ticket →
                </p>
              </GlassCard>
            </Link>
          ))}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <NeonLink href="/tickets" variant="secondary" shape="xl" className="w-full sm:w-auto">
              {upcomingCount > upcomingPreviews.length
                ? `View all ${upcomingCount} passes`
                : "Open My Tickets"}
            </NeonLink>
            {pastCount > 0 ? (
              <Link
                href="/tickets#history"
                className="text-center text-sm text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline"
              >
                {pastCount} in history
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
