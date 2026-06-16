"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { NeonButton } from "@/components/ui/neon-button"
import { cancelRsvp, rsvpToEvent } from "@/app/actions/registrations"
import { createTicketCheckoutSession } from "@/app/actions/ticket-checkout"
import { formatUsdFromCents } from "@/lib/money/usd"
import { calculateTicketCheckoutAmounts } from "@/lib/payments/ticket-fees"
import { TicketCheckoutPreview } from "@/components/events/ticket-checkout-preview"
import { TicketAddedSuccessDialog } from "@/components/events/ticket-added-success-dialog"
import { trackProductEvent, type ProductEventContext } from "@/lib/analytics/product-events"

export type PublicPaidTier = { id: string; name: string; price_cents: number }

export function EventRsvpCta({
  eventId,
  isSignedIn,
  initialStatus,
  authHref,
  rsvpCapacity = null,
  rsvpOccupied = 0,
  freeTicketTiers = [],
  paidTicketTiers = [],
  stripeCheckoutEnabled = false,
  hasActiveTicket = false,
  initialTicketId = null,
  eventTitle,
  startsAt,
  venueName,
  city,
  eventPublicUrl,
  analyticsContext,
}: {
  eventId: string
  isSignedIn: boolean
  initialStatus: "confirmed" | "cancelled" | "checked_in" | null
  authHref: string
  /** Max RSVPs (confirmed + checked in). Null = no limit. */
  rsvpCapacity?: number | null
  /** Current count from server (published events only). */
  rsvpOccupied?: number
  /** Free ($0) tiers currently on sale; empty = default tier only at mint time. */
  freeTicketTiers?: { id: string; name: string }[]
  /** Paid tiers on sale (USD / Stripe). */
  paidTicketTiers?: PublicPaidTier[]
  /** Server: STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. */
  stripeCheckoutEnabled?: boolean
  /** User already has a confirmed/checked-in ticket for this event. */
  hasActiveTicket?: boolean
  /** First active ticket id for this event (confirmed / checked-in registration). */
  initialTicketId?: string | null
  eventTitle: string
  startsAt: string
  venueName: string
  city: string
  /** Public URL for this event page (absolute when NEXT_PUBLIC_SITE_URL is set). */
  eventPublicUrl: string
  analyticsContext?: ProductEventContext
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)
  const [occupied, setOccupied] = useState(rsvpOccupied)
  const [selectedTierId, setSelectedTierId] = useState(freeTicketTiers[0]?.id ?? "")
  const [selectedPaidTierId, setSelectedPaidTierId] = useState(paidTicketTiers[0]?.id ?? "")
  const [successOpen, setSuccessOpen] = useState(false)
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null)

  const isConfirmed = status === "confirmed" || status === "checked_in"
  const isCheckedInDoor = status === "checked_in"
  const isFull =
    rsvpCapacity != null && rsvpCapacity > 0 && occupied >= rsvpCapacity && !isConfirmed
  const spotsLeft =
    rsvpCapacity != null && rsvpCapacity > 0 ? Math.max(0, rsvpCapacity - occupied) : null
  const fewSpotsLeft = spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 8 && !isConfirmed && !isFull
  const capLabel =
    rsvpCapacity != null && rsvpCapacity > 0
      ? `${Math.min(occupied, rsvpCapacity)} / ${rsvpCapacity} RSVPs`
      : occupied > 0
        ? `${occupied} RSVP${occupied === 1 ? "" : "s"}`
        : null

  const resolvedTicketId = successTicketId ?? initialTicketId
  const openTicketHref = resolvedTicketId ? `/tickets/${resolvedTicketId}` : "/tickets"
  const openTicketLabel = resolvedTicketId ? "Open My Ticket" : "Open My Tickets"
  const showTicketAccess = isSignedIn && (hasActiveTicket || isConfirmed)

  function tierArgForRsvp(): string | null {
    if (freeTicketTiers.length === 0) return null
    const pick = freeTicketTiers.find((t) => t.id === selectedTierId) ?? freeTicketTiers[0]
    return pick?.id ?? null
  }

  const paidOnSale = paidTicketTiers.filter((t) => t.price_cents > 0)
  const selectedPaidTier = paidOnSale.find((t) => t.id === selectedPaidTierId) ?? paidOnSale[0] ?? null
  const selectedPaidAmounts = selectedPaidTier ? calculateTicketCheckoutAmounts(selectedPaidTier.price_cents) : null
  const canBuyPaid =
    stripeCheckoutEnabled && paidOnSale.length > 0 && !hasActiveTicket && !isFull && !isConfirmed

  return (
    <div className="mt-4">
      {capLabel ? (
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[color:var(--neon-text2)]">
          {capLabel}
          {isFull ? (
            <span className="ml-2 inline font-sans normal-case text-[color:var(--neon-text1)]">
              , RSVP list is full.
            </span>
          ) : null}
        </p>
      ) : null}
      {fewSpotsLeft ? (
        <p className="mb-2 text-xs leading-relaxed text-amber-200/90">
          Only <span className="font-mono">{spotsLeft}</span> RSVP spot{spotsLeft === 1 ? "" : "s"} left at the
          posted limit.
        </p>
      ) : null}
      {!isSignedIn ? (
        <p className="mb-2 text-xs text-[color:var(--neon-text2)]">
          You’ll need an account to RSVP or buy tickets.
        </p>
      ) : null}
      {isSignedIn && (hasActiveTicket || isConfirmed) ? (
        <div className="mb-3 space-y-2">
          {isCheckedInDoor ? (
            <>
              <span className="inline-flex items-center rounded-full border border-emerald-400/45 bg-emerald-400/14 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-emerald-100">
                Checked in
              </span>
              <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
                You&apos;re checked in, head inside and enjoy.
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/50 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
                {hasActiveTicket ? "Confirmed, in My Tickets" : "RSVP saved"}
              </span>
              <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
                <span className="text-[color:var(--neon-text1)]">At the door:</span> open{" "}
                <span className="text-[color:var(--neon-text0)]">My Tickets</span>, expand{" "}
                <span className="text-[color:var(--neon-text0)]">Show this at the door</span>, and let staff scan your
                QR or enter your backup code.
              </p>
              <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
                Share the event or add it to your calendar using the buttons above.
              </p>
            </>
          )}
        </div>
      ) : null}
      {isFull ? (
        <p className="mb-3 text-sm text-[color:var(--neon-text1)]">This event is at capacity for RSVPs.</p>
      ) : null}

      {paidOnSale.length > 0 ? (
        <fieldset className="mb-4 space-y-2">
          <legend className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-2">
            Paid tiers
          </legend>
          {!stripeCheckoutEnabled ? (
            <p className="text-xs text-amber-200/90">
              Paid checkout is not configured in this environment yet (Stripe keys missing).
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {paidOnSale.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--neon-text1)]"
              >
                <input
                  type="radio"
                  name="paid_ticket_tier"
                  value={t.id}
                  checked={selectedPaidTierId === t.id}
                  onChange={() => setSelectedPaidTierId(t.id)}
                  disabled={!canBuyPaid}
                  className="h-4 w-4 accent-[color:var(--neon-a)]"
                />
                <span>
                  {t.name}{" "}
                  <span className="text-[color:var(--neon-text2)]">
                    ({formatUsdFromCents(t.price_cents)} face value)
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {freeTicketTiers.length > 1 && !isConfirmed && !hasActiveTicket ? (
        <fieldset className="mb-4 space-y-2">
          <legend className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-2">
            Free RSVP tier
          </legend>
          <div className="flex flex-col gap-2">
            {freeTicketTiers.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--neon-text1)]"
              >
                <input
                  type="radio"
                  name="ticket_tier"
                  value={t.id}
                  checked={selectedTierId === t.id}
                  onChange={() => setSelectedTierId(t.id)}
                  className="h-4 w-4 accent-[color:var(--neon-a)]"
                />
                <span>{t.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : freeTicketTiers.length === 1 && !isConfirmed && !hasActiveTicket ? (
        <p className="mb-3 text-xs text-[color:var(--neon-text2)]">
          Free tier: <span className="text-[color:var(--neon-text1)]">{freeTicketTiers[0].name}</span>
        </p>
      ) : null}

      {selectedPaidAmounts && canBuyPaid ? <TicketCheckoutPreview amounts={selectedPaidAmounts} /> : null}

      <div
        className={`grid grid-cols-1 gap-3 ${paidOnSale.length > 0 ? "sm:grid-cols-2" : ""}`}
      >
        {paidOnSale.length > 0 ? (
          <NeonButton
            fullWidth
            shape="xl"
            disabled={!canBuyPaid || isPending}
            onClick={() => {
              if (!isSignedIn) {
                trackProductEvent("signup_login_redirect", {
                  ...analyticsContext,
                  signed_in: false,
                  source: analyticsContext?.source ?? "event_detail",
                })
                window.location.href = authHref
                return
              }
              const tier = selectedPaidTier
              if (!tier) return

              trackProductEvent("paid_checkout_started", {
                ...analyticsContext,
                signed_in: true,
                source: analyticsContext?.source ?? "event_detail",
              })

              startTransition(async () => {
                const result = await createTicketCheckoutSession({
                  eventId,
                  ticketTypeId: tier.id,
                })
                if (result.error) {
                  toast.error(result.error)
                  return
                }
                if (result.url) {
                  window.location.href = result.url
                }
              })
            }}
          >
            {!isSignedIn
              ? "Sign in to buy"
              : !stripeCheckoutEnabled
                ? "Buy ticket"
                : hasActiveTicket || isConfirmed
                  ? "Buy ticket"
                  : isFull
                    ? "Sold out"
                    : "Buy ticket"}
          </NeonButton>
        ) : null}

        {showTicketAccess ? (
          <div className="flex flex-col gap-2">
            <NeonButton asChild fullWidth shape="xl">
              <Link href={openTicketHref}>{openTicketLabel}</Link>
            </NeonButton>
            {isConfirmed && !isCheckedInDoor ? (
              <NeonButton
                type="button"
                fullWidth
                variant="ghost"
                shape="xl"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await cancelRsvp(eventId)
                    if (result?.error) {
                      toast.error(result.error)
                      return
                    }
                    toast.success("RSVP cancelled.")
                    trackProductEvent("event_rsvp_cancelled", {
                      ...analyticsContext,
                      signed_in: true,
                      source: analyticsContext?.source ?? "event_detail",
                    })
                    setStatus("cancelled")
                    setSuccessTicketId(null)
                    setOccupied((n) => Math.max(0, n - 1))
                    router.refresh()
                  })
                }}
              >
                Cancel RSVP
              </NeonButton>
            ) : null}
          </div>
        ) : (
          <NeonButton
            fullWidth
            variant="secondary"
            shape="xl"
            disabled={isPending || isFull || hasActiveTicket}
            onClick={() => {
              if (!isSignedIn) {
                trackProductEvent("signup_login_redirect", {
                  ...analyticsContext,
                  signed_in: false,
                  source: analyticsContext?.source ?? "event_detail",
                })
                window.location.href = authHref
                return
              }

              trackProductEvent("event_rsvp_started", {
                ...analyticsContext,
                signed_in: true,
                source: analyticsContext?.source ?? "event_detail",
              })

              startTransition(async () => {
                const result = await rsvpToEvent(eventId, tierArgForRsvp())
                if (result?.error) {
                  toast.error(result.error)
                  return
                }
                trackProductEvent("event_rsvp_completed", {
                  ...analyticsContext,
                  signed_in: true,
                  source: analyticsContext?.source ?? "event_detail",
                })
                if (result && "success" in result && result.success) {
                  setSuccessTicketId(result.ticketId)
                  setSuccessOpen(true)
                  setStatus("confirmed")
                  setOccupied((n) => n + 1)
                  router.refresh()
                }
              })
            }}
          >
            {!isSignedIn
              ? "Sign in to RSVP"
              : hasActiveTicket
                ? "RSVP"
                : isFull
                  ? "RSVP full"
                  : "RSVP free"}
          </NeonButton>
        )}
      </div>
      {hasActiveTicket ? (
        <p className="mt-2 text-[11px] text-[color:var(--neon-text2)]">
          Canceling RSVP does not refund card purchases, contact the organizer for help.
        </p>
      ) : null}

      <TicketAddedSuccessDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        ticketId={successTicketId ?? initialTicketId}
        eventTitle={eventTitle}
        startsAt={startsAt}
        venueName={venueName}
        city={city}
        eventUrl={eventPublicUrl}
        variant="rsvp"
      />
    </div>
  )
}
