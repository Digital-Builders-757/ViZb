import {
  MIN_PAID_TICKET_CENTS,
  STRIPE_FIXED_CENTS,
  STRIPE_PERCENT,
  VIZB_PLATFORM_FEE_FIXED_CENTS,
  VIZB_PLATFORM_FEE_PERCENT,
} from "@/lib/payments/vizb-pricing-config"

export type VizbTicketPricing = {
  ticketSubtotalCents: number
  vizbServiceFeeCents: number
  subtotalBeforeProcessingCents: number
  buyerTotalCents: number
  processingFeeCents: number
  organizerPayoutCents: number
}

export type VizbTicketPricingInput = {
  ticketPriceCents: number
  quantity?: number
}

function assertWholePositiveInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer.`)
  }
}

function assertWholeNonNegativeInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer number of cents.`)
  }
}

export function isFreeTicketPriceCents(ticketPriceCents: number): boolean {
  return ticketPriceCents === 0
}

export function validatePaidTicketPriceForCheckout(
  ticketPriceCents: number,
): { ok: true } | { error: string } {
  assertWholeNonNegativeInteger(ticketPriceCents, "ticketPriceCents")

  if (isFreeTicketPriceCents(ticketPriceCents)) {
    return { error: "Free tickets use RSVP, not paid checkout." }
  }

  if (ticketPriceCents < MIN_PAID_TICKET_CENTS) {
    return {
      error: `Paid ticket price must be at least $${(MIN_PAID_TICKET_CENTS / 100).toFixed(2)}.`,
    }
  }

  return { ok: true }
}

/**
 * Official VIZB buyer pricing breakdown for paid tickets.
 *
 * - VIZB fee: ceil(5% of ticket subtotal) + $1.00 × quantity
 * - Processing: buyer total grosses up so Stripe 2.9% + $0.30 is covered
 * - Organizer payout: ticket face value only (Connect settlement is separate)
 */
export function calculateVizbTicketPricing(input: VizbTicketPricingInput): VizbTicketPricing {
  const quantity = input.quantity ?? 1
  const ticketPriceCents = input.ticketPriceCents

  assertWholePositiveInteger(quantity, "quantity")
  assertWholeNonNegativeInteger(ticketPriceCents, "ticketPriceCents")

  const paidCheck = validatePaidTicketPriceForCheckout(ticketPriceCents)
  if ("error" in paidCheck) {
    throw new Error(paidCheck.error)
  }

  const ticketSubtotalCents = ticketPriceCents * quantity

  const vizbServiceFeeCents =
    Math.ceil(ticketSubtotalCents * VIZB_PLATFORM_FEE_PERCENT) + VIZB_PLATFORM_FEE_FIXED_CENTS * quantity

  const subtotalBeforeProcessingCents = ticketSubtotalCents + vizbServiceFeeCents

  const buyerTotalCents = Math.ceil(
    (subtotalBeforeProcessingCents + STRIPE_FIXED_CENTS) / (1 - STRIPE_PERCENT),
  )

  const processingFeeCents = buyerTotalCents - subtotalBeforeProcessingCents

  return {
    ticketSubtotalCents,
    vizbServiceFeeCents,
    subtotalBeforeProcessingCents,
    buyerTotalCents,
    processingFeeCents,
    organizerPayoutCents: ticketSubtotalCents,
  }
}
