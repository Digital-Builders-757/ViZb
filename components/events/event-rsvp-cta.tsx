"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { NeonButton } from "@/components/ui/neon-button"
import { cancelRsvp, rsvpToEvent } from "@/app/actions/registrations"
import { createTicketCheckoutSession } from "@/app/actions/ticket-checkout"
import { formatUsdFromCents } from "@/lib/money/usd"

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
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)
  const [occupied, setOccupied] = useState(rsvpOccupied)
  const [selectedTierId, setSelectedTierId] = useState(freeTicketTiers[0]?.id ?? "")
  const [selectedPaidTierId, setSelectedPaidTierId] = useState(paidTicketTiers[0]?.id ?? "")

  const isConfirmed = status === "confirmed" || status === "checked_in"
  const isFull =
    rsvpCapacity != null && rsvpCapacity > 0 && occupied >= rsvpCapacity && !isConfirmed
  const capLabel =
    rsvpCapacity != null && rsvpCapacity > 0
      ? `${Math.min(occupied, rsvpCapacity)} / ${rsvpCapacity} RSVPs`
      : occupied > 0
        ? `${occupied} RSVP${occupied === 1 ? "" : "s"}`
        : null

  function tierArgForRsvp(): string | null {
    if (freeTicketTiers.length === 0) return null
    const pick = freeTicketTiers.find((t) => t.id === selectedTierId) ?? freeTicketTiers[0]
    return pick?.id ?? null
  }

  const paidOnSale = paidTicketTiers.filter((t) => t.price_cents > 0)
  const canBuyPaid =
    stripeCheckoutEnabled && paidOnSale.length > 0 && !hasActiveTicket && !isFull && !isConfirmed

  return (
    <div className="mt-4">
      {capLabel ? (
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[color:var(--neon-text2)]">
          {capLabel}
        </p>
      ) : null}
      {!isSignedIn ? (
        <p className="mb-2 text-xs text-[color:var(--neon-text2)]">
          You’ll need an account to RSVP or buy tickets.
        </p>
      ) : null}
      {hasActiveTicket ? (
        <p className="mb-3 text-sm text-[color:var(--neon-text1)]">
          You already have a ticket for this event. Open{" "}
          <Link href="/tickets" className="text-[color:var(--neon-a)] underline underline-offset-2">
            My Tickets
          </Link>{" "}
          for your pass.
        </p>
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
                    ({formatUsdFromCents(t.price_cents)})
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
                window.location.href = authHref
                return
              }
              const tier = paidOnSale.find((t) => t.id === selectedPaidTierId) ?? paidOnSale[0]
              if (!tier) return

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

        <NeonButton
          fullWidth
          variant={isConfirmed ? "primary" : "secondary"}
          shape="xl"
          disabled={isPending || isFull || hasActiveTicket}
          onClick={() => {
            if (!isSignedIn) {
              window.location.href = authHref
              return
            }

            startTransition(async () => {
              if (isConfirmed) {
                const result = await cancelRsvp(eventId)
                if (result?.error) {
                  toast.error(result.error)
                  return
                }
                toast.success("RSVP cancelled.")
                setStatus("cancelled")
                setOccupied((n) => Math.max(0, n - 1))
                router.refresh()
                return
              }

              const result = await rsvpToEvent(eventId, tierArgForRsvp())
              if (result?.error) {
                toast.error(result.error)
                return
              }

              toast.success("You're on the list.")
              setStatus("confirmed")
              setOccupied((n) => n + 1)
              router.refresh()
            })
          }}
        >
          {!isSignedIn
            ? "Sign in to RSVP"
            : hasActiveTicket
              ? "RSVP"
              : isFull
                ? "RSVP full"
                : isConfirmed
                  ? "Cancel RSVP"
                  : "RSVP free"}
        </NeonButton>
      </div>
      {hasActiveTicket ? (
        <p className="mt-2 text-[11px] text-[color:var(--neon-text2)]">
          Canceling RSVP does not refund card purchases — contact the organizer for help.
        </p>
      ) : null}
    </div>
  )
}
