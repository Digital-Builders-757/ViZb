import { describe, expect, it } from "vitest"

import {
  calculatePlatformFeeCents,
  calculateTicketCheckoutAmounts,
  calculateVizbTicketPricing,
  VIZB_PLATFORM_FEE_BPS,
} from "@/lib/payments/ticket-fees"

describe("calculatePlatformFeeCents (legacy percent-only)", () => {
  it("calculates the 5% platform fee in cents with ceil", () => {
    expect(calculatePlatformFeeCents(2_500)).toBe(125)
    expect(calculatePlatformFeeCents(999)).toBe(50)
  })

  it("returns zero for a zero subtotal", () => {
    expect(calculatePlatformFeeCents(0)).toBe(0)
  })

  it("rejects non-integer cents", () => {
    expect(() => calculatePlatformFeeCents(10.5)).toThrow(/subtotalCents/)
  })
})

describe("calculateTicketCheckoutAmounts", () => {
  it("maps canonical pricing to checkout order fields", () => {
    expect(calculateTicketCheckoutAmounts(2_000)).toEqual({
      subtotalCents: 2_000,
      platformFeeCents: 200,
      processingFeeCents: 97,
      totalCents: 2_297,
      organizerPayoutCents: 2_000,
    })
  })

  it("exposes basis points derived from launch percent", () => {
    expect(VIZB_PLATFORM_FEE_BPS).toBe(500)
  })

  it("delegates quantity to calculateVizbTicketPricing", () => {
    expect(calculateTicketCheckoutAmounts(2_000, 2)).toEqual({
      subtotalCents: 4_000,
      platformFeeCents: 400,
      processingFeeCents: 163,
      totalCents: 4_563,
      organizerPayoutCents: 4_000,
    })
  })
})

describe("calculateVizbTicketPricing re-export", () => {
  it("is available from ticket-fees barrel", () => {
    expect(calculateVizbTicketPricing({ ticketPriceCents: 500 }).buyerTotalCents).toBe(675)
  })
})
