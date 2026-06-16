import { describe, expect, it } from "vitest"

import {
  calculateVizbTicketPricing,
  isFreeTicketPriceCents,
  validatePaidTicketPriceForCheckout,
} from "@/lib/payments/calculate-vizb-ticket-pricing"
import {
  MIN_PAID_TICKET_CENTS,
  STRIPE_FIXED_CENTS,
  STRIPE_PERCENT,
  VIZB_PLATFORM_FEE_FIXED_CENTS,
  VIZB_PLATFORM_FEE_PERCENT,
} from "@/lib/payments/vizb-pricing-config"

describe("vizb-pricing-config", () => {
  it("exports launch fee constants", () => {
    expect(VIZB_PLATFORM_FEE_PERCENT).toBe(0.05)
    expect(VIZB_PLATFORM_FEE_FIXED_CENTS).toBe(100)
    expect(STRIPE_PERCENT).toBe(0.029)
    expect(STRIPE_FIXED_CENTS).toBe(30)
    expect(MIN_PAID_TICKET_CENTS).toBe(500)
  })
})

describe("validatePaidTicketPriceForCheckout", () => {
  it("blocks free RSVP tiers from paid checkout pricing", () => {
    expect(validatePaidTicketPriceForCheckout(0)).toEqual({
      error: "Free tickets use RSVP, not paid checkout.",
    })
    expect(isFreeTicketPriceCents(0)).toBe(true)
  })

  it("blocks paid tickets under the $5 minimum", () => {
    expect(validatePaidTicketPriceForCheckout(499)).toEqual({
      error: "Paid ticket price must be at least $5.00.",
    })
  })
})

describe("calculateVizbTicketPricing", () => {
  it("calculates $5 ticket (qty 1)", () => {
    expect(calculateVizbTicketPricing({ ticketPriceCents: 500 })).toEqual({
      ticketSubtotalCents: 500,
      vizbServiceFeeCents: 125,
      subtotalBeforeProcessingCents: 625,
      buyerTotalCents: 675,
      processingFeeCents: 50,
      organizerPayoutCents: 500,
    })
  })

  it("calculates $10 ticket (qty 1)", () => {
    expect(calculateVizbTicketPricing({ ticketPriceCents: 1_000 })).toEqual({
      ticketSubtotalCents: 1_000,
      vizbServiceFeeCents: 150,
      subtotalBeforeProcessingCents: 1_150,
      buyerTotalCents: 1_216,
      processingFeeCents: 66,
      organizerPayoutCents: 1_000,
    })
  })

  it("calculates $20 ticket (qty 1)", () => {
    expect(calculateVizbTicketPricing({ ticketPriceCents: 2_000 })).toEqual({
      ticketSubtotalCents: 2_000,
      vizbServiceFeeCents: 200,
      subtotalBeforeProcessingCents: 2_200,
      buyerTotalCents: 2_297,
      processingFeeCents: 97,
      organizerPayoutCents: 2_000,
    })
  })

  it("calculates $50 ticket (qty 1)", () => {
    expect(calculateVizbTicketPricing({ ticketPriceCents: 5_000 })).toEqual({
      ticketSubtotalCents: 5_000,
      vizbServiceFeeCents: 350,
      subtotalBeforeProcessingCents: 5_350,
      buyerTotalCents: 5_541,
      processingFeeCents: 191,
      organizerPayoutCents: 5_000,
    })
  })

  it("calculates $100 ticket (qty 1)", () => {
    expect(calculateVizbTicketPricing({ ticketPriceCents: 10_000 })).toEqual({
      ticketSubtotalCents: 10_000,
      vizbServiceFeeCents: 600,
      subtotalBeforeProcessingCents: 10_600,
      buyerTotalCents: 10_948,
      processingFeeCents: 348,
      organizerPayoutCents: 10_000,
    })
  })

  it("supports quantity greater than 1", () => {
    expect(calculateVizbTicketPricing({ ticketPriceCents: 2_000, quantity: 2 })).toEqual({
      ticketSubtotalCents: 4_000,
      vizbServiceFeeCents: 400,
      subtotalBeforeProcessingCents: 4_400,
      buyerTotalCents: 4_563,
      processingFeeCents: 163,
      organizerPayoutCents: 4_000,
    })
  })

  it("rejects free RSVP pricing", () => {
    expect(() => calculateVizbTicketPricing({ ticketPriceCents: 0 })).toThrow(/RSVP/)
  })

  it("rejects paid ticket under $5", () => {
    expect(() => calculateVizbTicketPricing({ ticketPriceCents: 499 })).toThrow(/\$5\.00/)
  })
})
