import { describe, expect, it } from "vitest"

import {
  calculatePlatformFeeCents,
  calculateTicketCheckoutAmounts,
  VIZB_PLATFORM_FEE_BPS,
} from "@/lib/payments/ticket-fees"

describe("calculatePlatformFeeCents", () => {
  it("calculates the default 5% platform fee in cents", () => {
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
  it("returns subtotal, fee, and total", () => {
    expect(calculateTicketCheckoutAmounts(1_500)).toEqual({
      subtotalCents: 1_500,
      platformFeeCents: 75,
      totalCents: 1_575,
    })
  })

  it("supports custom basis points", () => {
    expect(VIZB_PLATFORM_FEE_BPS).toBe(500)
    expect(calculateTicketCheckoutAmounts(2_000, 250)).toEqual({
      subtotalCents: 2_000,
      platformFeeCents: 50,
      totalCents: 2_050,
    })
  })
})
