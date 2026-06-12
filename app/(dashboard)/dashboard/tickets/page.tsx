import type { ReactNode } from "react"
import Link from "next/link"
import { headers } from "next/headers"
import { requireAuth } from "@/lib/auth-helpers"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import { GlassCard } from "@/components/ui/glass-card"
import { TicketWalletCard } from "@/components/dashboard/tickets/ticket-wallet-card"
import { buildTicketQrToken, getTicketQrSecret, TICKET_QR_TTL_SECONDS } from "@/lib/ticket-qr-token"
import { isAppleWalletPassConfigured, isGoogleWalletPassConfigured } from "@/lib/wallet/env"
import {
  coalesceRelation,
  firstWalletEvent,
  getTicketEventPhase,
  normalizeTicketWalletRow,
  partitionWalletRowsByEffectiveEnd,
  ticketQrEligibleFromRegistration,
  type TicketWalletRow,
  type TicketWalletRowRaw,
  type WalletEvent,
} from "@/lib/dashboard/ticket-wallet-shared"
import { getEventEffectiveEndMs } from "@/lib/events/event-schedule"

type TicketRowParsed = TicketWalletRow & {
  event: WalletEvent
  eventStartMs: number | null
  eventEffectiveEndMs: number | null
}

async function siteOrigin(): Promise<string> {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (envBase) return envBase

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) return ""
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

function parseTicketRows(raw: TicketWalletRow[] | null): TicketRowParsed[] {
  if (!raw?.length) return []
  const out: TicketRowParsed[] = []
  for (const row of raw) {
    const e = firstWalletEvent(coalesceRelation(row.event_registrations.event))
    if (!e) continue
    const t = new Date(e.starts_at).getTime()
    const effectiveEndMs = getEventEffectiveEndMs(e.starts_at, e.ends_at ?? null)
    out.push({
      ...row,
      event: e,
      eventStartMs: Number.isNaN(t) ? null : t,
      eventEffectiveEndMs: Number.isNaN(effectiveEndMs) ? null : effectiveEndMs,
    })
  }
  return out
}

function TicketSection({
  sectionId,
  title,
  subtitle,
  rows,
  emptyState,
  origin,
  walletAppleEnabled,
  walletGoogleEnabled,
  ticketSecret,
  qrIssuedAtUnixSeconds,
  nowMs,
  qrDefaultOpen = false,
  qrSize = 200,
}: {
  sectionId?: string
  title: string
  subtitle?: string
  rows: TicketRowParsed[]
  emptyState?: ReactNode
  origin: string
  walletAppleEnabled: boolean
  walletGoogleEnabled: boolean
  ticketSecret: string | null
  qrIssuedAtUnixSeconds: number
  nowMs: number
  qrDefaultOpen?: boolean
  qrSize?: number
}) {
  if (rows.length === 0 && !emptyState) return null

  return (
    <section id={sectionId} className="min-w-0 scroll-mt-24 space-y-3">
      <div>
        <h2 className="font-serif text-lg font-bold text-[color:var(--neon-text0)] md:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[color:var(--neon-text2)]">{subtitle}</p> : null}
      </div>
      {rows.length === 0 && emptyState ? emptyState : null}
      {rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {rows.map((r) => {
            const e = r.event
            const base = origin || ""
            const eventAbsoluteUrl = base ? `${base}/events/${e.slug}` : `/events/${e.slug}`
            const eventPhase = getTicketEventPhase(r.eventEffectiveEndMs, nowMs)

            const signingOk = Boolean(ticketSecret && r.event_id)
            const eligible = ticketQrEligibleFromRegistration({
              registrationStatus: r.event_registrations.status,
              eventStartsAtIso: e.starts_at,
              nowMs,
            })
            const qrToken =
              signingOk && eligible
                ? buildTicketQrToken(
                    {
                      v: 1,
                      rid: r.event_registrations.id,
                      eid: r.event_id,
                      exp: qrIssuedAtUnixSeconds + TICKET_QR_TTL_SECONDS,
                    },
                    ticketSecret!,
                  )
                : null

            return (
              <TicketWalletCard
                key={r.id}
                ticketId={r.id}
                ticketCode={r.ticket_code}
                ticketTypeName={r.ticket_type_name}
                registrationId={r.event_registrations.id}
                walletAppleEnabled={walletAppleEnabled}
                walletGoogleEnabled={walletGoogleEnabled}
                status={r.event_registrations.status}
                createdAt={r.event_registrations.created_at}
                checkedInAt={r.event_registrations.checked_in_at}
                event={e}
                eventPhase={eventPhase}
                eventAbsoluteUrl={eventAbsoluteUrl}
                qrToken={qrToken}
                ticketSigningConfigured={Boolean(ticketSecret)}
                ticketQrEligible={eligible}
                qrDefaultOpen={qrDefaultOpen}
                qrSize={qrSize}
              />
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

export default async function TicketsPage() {
  const { user, supabase } = await requireAuth()
  const origin = await siteOrigin()

  const walletAppleEnabled = isAppleWalletPassConfigured()
  const walletGoogleEnabled = isGoogleWalletPassConfigured()

  let rows: TicketWalletRow[] | null = null
  let loadError: string | null = null

  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `id, ticket_code, event_id, event_registration_id, ticket_types ( name ), event_registrations!inner ( id, status, created_at, checked_in_at, event:events ( title, slug, starts_at, ends_at, city, venue_name, flyer_url ) )`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) loadError = error.message
    else {
      const raw = (data ?? []) as TicketWalletRowRaw[]
      rows = raw.map(normalizeTicketWalletRow).filter((r): r is TicketWalletRow => r != null)
    }
  } catch {
    loadError = "Ticketing is not fully configured on this environment yet."
    rows = null
  }

  const parsed = parseTicketRows(rows)
  const clock = new Date()
  const nowMs = clock.getTime()
  const qrIssuedAtUnixSeconds = Math.floor(nowMs / 1000)
  const ticketSecret = getTicketQrSecret()

  const { upcoming, past, undated } = partitionWalletRowsByEffectiveEnd(parsed, nowMs)
  const activeRows = [...upcoming, ...undated]

  return (
    <div className="min-w-0 space-y-8 md:space-y-10">
      <header className="min-w-0">
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          After you RSVP or buy
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">My Tickets</h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Active tickets stay up top for quick door access. Past events move to{" "}
          <span className="text-[color:var(--neon-text0)]">Ticket history</span> so you always have receipts and
          memories—nothing disappears after the show.
        </p>
      </header>

      {loadError ? (
        <GlassCard className="p-4">
          <p className="text-sm text-amber-200/90">{loadError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Apply migrations through{" "}
            <span className="font-mono">supabase/migrations/20260410142142_tickets_core_free_rsvp.sql</span> (or{" "}
            <span className="font-mono">scripts/028_tickets_core_free_rsvp.sql</span>) after event registrations (
            <span className="font-mono">025</span>).
          </p>
        </GlassCard>
      ) : null}

      {parsed.length === 0 && !loadError ? (
        <EmptyStateCard
          kicker="No tickets yet"
          title="RSVP or buy on an event page"
          description="Open any published event, RSVP free or complete checkout for a paid tier, and your ticket will show up here with date, venue, and calendar actions."
        >
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
              Browse events
            </NeonLink>
            <Link
              href="/events"
              className="text-center text-sm text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline sm:text-left"
            >
              See all events
            </Link>
          </div>
        </EmptyStateCard>
      ) : null}

      {parsed.length > 0 ? (
        <div className="min-w-0 space-y-10">
          <TicketSection
            title="Active tickets"
            subtitle="Upcoming and ongoing events—including any without a firm end time."
            rows={activeRows}
            emptyState={
              past.length > 0 ? (
                <EmptyStateCard
                  kicker="No active tickets"
                  title="You're caught up for now"
                  description="Nothing upcoming on your calendar. Your past tickets are saved in Ticket history below."
                >
                  <NeonLink href="#history" variant="secondary" shape="xl" className="sm:w-auto">
                    View ticket history
                  </NeonLink>
                </EmptyStateCard>
              ) : undefined
            }
            origin={origin}
            walletAppleEnabled={walletAppleEnabled}
            walletGoogleEnabled={walletGoogleEnabled}
            ticketSecret={ticketSecret}
            qrIssuedAtUnixSeconds={qrIssuedAtUnixSeconds}
            nowMs={nowMs}
            qrDefaultOpen
            qrSize={256}
          />

          <TicketSection
            sectionId="history"
            title="Ticket history"
            subtitle="Past events stay here for receipts, proof of purchase, and memories."
            rows={past}
            emptyState={
              activeRows.length > 0 ? (
                <GlassCard className="p-4">
                  <p className="text-sm text-[color:var(--neon-text1)]">
                    No past tickets yet. After an event ends, it moves here automatically.
                  </p>
                </GlassCard>
              ) : undefined
            }
            origin={origin}
            walletAppleEnabled={walletAppleEnabled}
            walletGoogleEnabled={walletGoogleEnabled}
            ticketSecret={ticketSecret}
            qrIssuedAtUnixSeconds={qrIssuedAtUnixSeconds}
            nowMs={nowMs}
          />
        </div>
      ) : null}
    </div>
  )
}
