import Image from "next/image"
import Link from "next/link"
import { EventCalendarActions } from "@/components/dashboard/tickets/event-calendar-actions"
import { TicketWalletPassActions } from "@/components/dashboard/tickets/ticket-wallet-actions"
import { TicketQrReveal } from "@/components/dashboard/tickets/ticket-qr-reveal"
import { getTicketDisplayState, type TicketEventPhase } from "@/lib/dashboard/ticket-wallet-shared"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

export type TicketWalletEvent = {
  title: string
  slug: string
  starts_at: string
  city: string
  venue_name: string
  flyer_url: string | null
}

function TicketPassDivider() {
  return (
    <div
      className="relative my-5 border-t border-dashed border-[color:var(--neon-hairline)]/70"
      aria-hidden
    >
      <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[color:var(--neon-bg0)]" />
      <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[color:var(--neon-bg0)]" />
    </div>
  )
}

export function TicketWalletCard({
  ticketId,
  ticketCode,
  ticketTypeName,
  registrationId,
  walletAppleEnabled,
  walletGoogleEnabled,
  status,
  createdAt,
  checkedInAt,
  event: e,
  eventPhase = "upcoming",
  eventAbsoluteUrl,
  qrToken,
  ticketSigningConfigured,
  ticketQrEligible,
  qrDefaultOpen = false,
  qrShowFullBackupCode = false,
  qrSize = 200,
  compactDetailsLink = false,
}: {
  ticketId: string
  /** Public-facing ticket reference (16-char hex); not used for door QR. */
  ticketCode: string
  ticketTypeName?: string | null
  registrationId: string
  walletAppleEnabled: boolean
  walletGoogleEnabled: boolean
  status: string
  createdAt: string
  checkedInAt: string | null
  event: TicketWalletEvent
  eventPhase?: TicketEventPhase
  /** Full URL for calendar description (server-derived). */
  eventAbsoluteUrl: string
  /** Signed payload for door check-in; omitted when signing is not configured or outside the door window. */
  qrToken?: string | null
  ticketSigningConfigured: boolean
  /** Registration status allows QR and event is within show-at-door window. */
  ticketQrEligible: boolean
  qrDefaultOpen?: boolean
  qrShowFullBackupCode?: boolean
  qrSize?: number
  /** Hide prominent details CTA on detail pages. */
  compactDetailsLink?: boolean
}) {
  const start = new Date(e.starts_at)
  const dateValid = !Number.isNaN(start.getTime())
  const dateLine = dateValid
    ? start.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Date to be announced"

  const isPast = eventPhase === "past"
  const display = getTicketDisplayState(status, eventPhase)

  return (
    <GlassCard
      className={`min-w-0 overflow-hidden p-0 ${display.cardAccentClassName}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          {e.flyer_url ? (
            <div className="relative hidden h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-[color:var(--neon-hairline)]/60 sm:block">
              <Image src={e.flyer_url} alt="" fill className="object-cover" sizes="80px" />
            </div>
          ) : (
            <div
              className="hidden h-24 w-20 shrink-0 rounded-lg border border-[color:var(--neon-hairline)]/60 bg-gradient-to-br from-[color:var(--neon-a)]/20 via-[color:var(--neon-b)]/10 to-transparent sm:block"
              aria-hidden
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--neon-a)]">
              Event pass
            </p>
            <p className="mt-1 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
              {dateLine}
            </p>
            <Link
              href={`/events/${e.slug}`}
              className="mt-2 block break-words font-serif text-xl font-bold leading-snug text-[color:var(--neon-text0)] underline-offset-4 hover:underline sm:text-2xl"
            >
              {e.title}
            </Link>
            <p className="mt-2 break-words text-sm leading-relaxed text-[color:var(--neon-text1)]">
              <span className="font-medium text-[color:var(--neon-text0)]/90">{e.venue_name}</span>
              {e.city ? (
                <>
                  <span className="text-[color:var(--neon-text2)]"> · </span>
                  {e.city}
                </>
              ) : null}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${display.statusBadgeClassName}`}
              >
                {display.statusLabel}
              </span>
              {isPast && status !== "cancelled" && status !== "confirmed" ? (
                <span className="inline-flex items-center rounded-full border border-[color:var(--neon-hairline)]/80 bg-[color:var(--neon-surface)]/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Event ended
                </span>
              ) : null}
              {isPast && status === "confirmed" ? (
                <span className="inline-flex items-center rounded-full border border-[color:var(--neon-hairline)]/80 bg-[color:var(--neon-surface)]/30 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Event ended
                </span>
              ) : null}
              {status === "checked_in" && checkedInAt ? (
                <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                  In at{" "}
                  {new Date(checkedInAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <TicketPassDivider />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Ticket tier</p>
            <p className="mt-1 text-sm font-medium text-[color:var(--neon-text0)]">
              {ticketTypeName ?? "General admission"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
              Ticket code
            </p>
            <p className="mt-1 select-all font-mono text-sm tracking-wider text-[color:var(--neon-text0)]">
              {ticketCode}
            </p>
          </div>
        </div>

        <p className="mt-3 text-[10px] font-mono text-[color:var(--neon-text2)]">
          Issued{" "}
          {new Date(createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {display.showDoorHint && (status === "confirmed" || status === "checked_in") ? (
          <div className="mt-4 rounded-xl border border-[color:var(--neon-a)]/25 bg-[color:color-mix(in_srgb,var(--neon-a)_8%,var(--neon-surface))] px-3 py-2.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-a)]">
              At the door
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--neon-text1)]">
              {status === "checked_in"
                ? "You’re checked in. Keep this pass open until you leave."
                : "Expand the QR below so staff can scan you in quickly."}
            </p>
          </div>
        ) : null}
      </div>

      {status === "cancelled"
        ? null
        : qrToken
          ? (
              <TicketQrReveal
                token={qrToken}
                label={`Check-in QR for ${e.title}`}
                defaultOpen={qrDefaultOpen}
                showFullBackupCode={qrShowFullBackupCode}
                size={qrSize}
              />
            )
          : status === "confirmed" || status === "checked_in"
            ? (
                <div className="border-t border-[color:var(--neon-hairline)]/50 px-4 py-3 sm:px-5">
                  <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
                    {!ticketSigningConfigured ? (
                      <>
                        Check-in QR is not available in this environment. Configure{" "}
                        <span className="font-mono text-[color:var(--neon-text1)]">TICKET_QR_SECRET</span> on the
                        server.
                      </>
                    ) : !ticketQrEligible ? (
                      <>
                        {isPast
                          ? "This event has ended. Your ticket remains in history for your records."
                          : "Check-in QR appears closer to the event. At the door, show this pass or contact the organizer."}
                      </>
                    ) : null}
                  </p>
                </div>
              )
            : null}

      <div className="space-y-3 border-t border-[color:var(--neon-hairline)]/50 p-4 sm:p-5">
        {dateValid && !isPast ? (
          <EventCalendarActions
            title={e.title}
            startsAt={e.starts_at}
            venueName={e.venue_name}
            city={e.city}
            eventUrl={eventAbsoluteUrl}
          />
        ) : null}

        {!isPast ? (
          <TicketWalletPassActions
            registrationId={registrationId}
            appleEnabled={walletAppleEnabled}
            googleEnabled={walletGoogleEnabled}
          />
        ) : null}

        {!compactDetailsLink ? (
          <NeonLink href={`/tickets/${ticketId}`} fullWidth shape="xl" variant="secondary">
            Ticket details
          </NeonLink>
        ) : null}
      </div>
    </GlassCard>
  )
}
