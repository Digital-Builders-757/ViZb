import {
  calculateVizbTicketPricing,
  type VizbTicketPricing,
  type VizbTicketPricingInput,
} from "@/lib/payments/calculate-vizb-ticket-pricing"
import {
  MIN_PAID_TICKET_CENTS,
  VIZB_PLATFORM_FEE_BPS,
  VIZB_PLATFORM_FEE_FIXED_CENTS,
  VIZB_PLATFORM_FEE_PERCENT,
} from "@/lib/payments/vizb-pricing-config"

export {
  MIN_PAID_TICKET_CENTS,
  STRIPE_FIXED_CENTS,
  STRIPE_PERCENT,
  VIZB_PLATFORM_FEE_BPS,
  VIZB_PLATFORM_FEE_FIXED_CENTS,
  VIZB_PLATFORM_FEE_PERCENT,
} from "@/lib/payments/vizb-pricing-config"

export {
  calculateVizbTicketPricing,
  isFreeTicketPriceCents,
  validatePaidTicketPriceForCheckout,
  type VizbTicketPricing,
  type VizbTicketPricingInput,
} from "@/lib/payments/calculate-vizb-ticket-pricing"

/** @deprecated Prefer VizbTicketPricing — legacy checkout shape. */
export type TicketCheckoutAmounts = {
  subtotalCents: number
  platformFeeCents: number
  processingFeeCents: number
  totalCents: number
  organizerPayoutCents: number
}

export function toTicketCheckoutAmounts(pricing: VizbTicketPricing): TicketCheckoutAmounts {
  return {
    subtotalCents: pricing.ticketSubtotalCents,
    platformFeeCents: pricing.vizbServiceFeeCents,
    processingFeeCents: pricing.processingFeeCents,
    totalCents: pricing.buyerTotalCents,
    organizerPayoutCents: pricing.organizerPayoutCents,
  }
}

/** Shared entry point for checkout, Stripe sessions, and order rows. */
export function calculateTicketCheckoutAmounts(
  ticketPriceCents: number,
  quantity = 1,
): TicketCheckoutAmounts {
  return toTicketCheckoutAmounts(calculateVizbTicketPricing({ ticketPriceCents, quantity }))
}

/** @deprecated Use calculateVizbTicketPricing — percent fee only, no fixed/processing. */
export function calculatePlatformFeeCents(subtotalCents: number): number {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("subtotalCents must be a non-negative integer number of cents.")
  }
  return Math.ceil(subtotalCents * VIZB_PLATFORM_FEE_PERCENT)
}
