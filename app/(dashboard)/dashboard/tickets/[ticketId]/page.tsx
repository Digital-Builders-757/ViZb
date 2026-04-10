import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { requireAuth } from "@/lib/auth-helpers"
import { NeonLink } from "@/components/ui/neon-link"
import { TicketWalletCard } from "@/components/dashboard/tickets/ticket-wallet-card"
import { buildTicketQrToken, getTicketQrSecret, TICKET_QR_TTL_SECONDS } from "@/lib/ticket-qr-token"
import { isAppleWalletPassConfigured, isGoogleWalletPassConfigured } from "@/lib/wallet/env"
import {
  coalesceRelation,
  firstWalletEvent,
  normalizeTicketWalletRow,
  ticketQrEligibleFromRegistration,
  type TicketWalletRow,
  type TicketWalletRowRaw,
} from "@/lib/dashboard/ticket-wallet-shared"

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
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

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params
  if (!isUuid(ticketId)) notFound()

  const { user, supabase } = await requireAuth()
  const origin = await siteOrigin()

  const { data, error } = await supabase
    .from("tickets")
    .select(
      `id, ticket_code, event_id, event_registration_id, event_registrations!inner ( id, status, created_at, checked_in_at, event:events ( title, slug, starts_at, city, venue_name, flyer_url ) )`,
    )
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !data) notFound()

  const row = normalizeTicketWalletRow(data as TicketWalletRowRaw)
  if (!row) notFound()

  const event = firstWalletEvent(coalesceRelation(row.event_registrations.event))
  if (!event) notFound()

  const walletAppleEnabled = isAppleWalletPassConfigured()
  const walletGoogleEnabled = isGoogleWalletPassConfigured()
  const clock = new Date()
  const nowMs = clock.getTime()
  const qrIssuedAtUnixSeconds = Math.floor(nowMs / 1000)
  const ticketSecret = getTicketQrSecret()

  const base = origin || ""
  const eventAbsoluteUrl = base ? `${base}/events/${event.slug}` : `/events/${event.slug}`
  const eligible = ticketQrEligibleFromRegistration({
    registrationStatus: row.event_registrations.status,
    eventStartsAtIso: event.starts_at,
    nowMs,
  })
  const signingOk = Boolean(ticketSecret && row.event_id)
  const qrToken =
    signingOk && eligible
      ? buildTicketQrToken(
          {
            v: 1,
            rid: row.event_registrations.id,
            eid: row.event_id,
            exp: qrIssuedAtUnixSeconds + TICKET_QR_TTL_SECONDS,
          },
          ticketSecret!,
        )
      : null

  return (
    <div className="min-w-0 space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <NeonLink href="/dashboard/tickets" variant="secondary" size="sm" className="w-full sm:w-auto">
          ← My tickets
        </NeonLink>
        <Link
          href={`/events/${event.slug}`}
          className="text-sm text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline"
        >
          Event page
        </Link>
      </div>

      <header>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Ticket</span>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">{event.title}</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Keep this code for your records. Door check-in still uses the live QR (same as on My tickets).
        </p>
      </header>

      <TicketWalletCard
        ticketId={row.id}
        ticketCode={row.ticket_code}
        registrationId={row.event_registrations.id}
        walletAppleEnabled={walletAppleEnabled}
        walletGoogleEnabled={walletGoogleEnabled}
        status={row.event_registrations.status}
        createdAt={row.event_registrations.created_at}
        checkedInAt={row.event_registrations.checked_in_at}
        event={event}
        eventAbsoluteUrl={eventAbsoluteUrl}
        qrToken={qrToken}
        ticketSigningConfigured={Boolean(ticketSecret)}
        ticketQrEligible={eligible}
      />
    </div>
  )
}
