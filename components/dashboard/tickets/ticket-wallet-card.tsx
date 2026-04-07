import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { EventCalendarActions } from "@/components/dashboard/tickets/event-calendar-actions"
import { TicketQrReveal } from "@/components/dashboard/tickets/ticket-qr-reveal"

export type TicketWalletEvent = {
  title: string
  slug: string
  starts_at: string
  city: string
  venue_name: string
  flyer_url: string | null
}

export function TicketWalletCard({
  status,
  createdAt,
  checkedInAt,
  event: e,
  eventAbsoluteUrl,
  qrToken,
  ticketSigningConfigured,
  ticketQrEligible,
}: {
  status: string
  createdAt: string
  checkedInAt: string | null
  event: TicketWalletEvent
  /** Full URL for calendar description (server-derived). */
  eventAbsoluteUrl: string
  /** Signed payload for door check-in; omitted when signing is not configured or outside the door window. */
  qrToken?: string | null
  ticketSigningConfigured: boolean
  /** Registration status allows QR and event is within show-at-door window. */
  ticketQrEligible: boolean
}) {
  const start = new Date(e.starts_at)
  const dateValid = !Number.isNaN(start.getTime())
  const dateLine = dateValid
    ? start.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Date to be announced"

  return (
    <GlassCard className="min-w-0 overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">{dateLine}</p>
          <Link
            href={`/events/${e.slug}`}
            className="mt-2 block break-words font-serif text-lg font-bold leading-snug text-[color:var(--neon-text0)] underline-offset-4 hover:underline sm:text-xl"
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
            <span className="inline-flex items-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/50 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
              {status === "checked_in"
                ? "Checked in"
                : status === "confirmed"
                  ? "Confirmed"
                  : status === "cancelled"
                    ? "Cancelled"
                    : status.replace(/_/g, " ")}
            </span>
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

          <p className="mt-2 text-[10px] font-mono text-[color:var(--neon-text2)]">
            RSVP saved{" "}
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {status === "cancelled"
        ? null
        : qrToken
          ? (
              <TicketQrReveal token={qrToken} label={`Check-in QR for ${e.title}`} />
            )
          : status === "confirmed" || status === "checked_in"
            ? (
                <p className="mt-4 text-[11px] font-mono text-[color:var(--neon-text2)]">
                  {!ticketSigningConfigured ? (
                    <>
                      Door check-in code unavailable — set{" "}
                      <span className="text-[color:var(--neon-text1)]">TICKET_QR_SECRET</span> on the server.
                    </>
                  ) : !ticketQrEligible ? (
                    <>
                      Door check-in code is only shown around the event. If you still need help at the door, contact
                      the organizer — you can share your RSVP confirmation from email.
                    </>
                  ) : null}
                </p>
              )
            : null}

      {dateValid ? (
        <EventCalendarActions
          title={e.title}
          startsAt={e.starts_at}
          venueName={e.venue_name}
          city={e.city}
          eventUrl={eventAbsoluteUrl}
        />
      ) : null}
    </GlassCard>
  )
}
