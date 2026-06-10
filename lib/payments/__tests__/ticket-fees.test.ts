import { afterEach, describe, expect, it, vi } from "vitest"

import {
  calculatePlatformFeeCents,
  calculateTicketCheckoutAmounts,
  getPlatformFeeFixedCentsFromEnv,
  getPlatformFeePercentFromEnv,
  VIZB_PLATFORM_FEE_BPS,
} from "@/lib/payments/ticket-fees"

const baseEnv = { ...process.env }

afterEach(() => {
  process.env = { ...baseEnv }
  vi.unstubAllEnvs()
})

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

  it("adds fixed cents from env override", () => {
    vi.stubEnv("TICKET_PLATFORM_FEE_PERCENT", "0")
    vi.stubEnv("TICKET_PLATFORM_FEE_FIXED_CENTS", "99")
    expect(calculateTicketCheckoutAmounts(1_000)).toEqual({
      subtotalCents: 1_000,
      platformFeeCents: 99,
      totalCents: 1_099,
    })
  })
})

describe("platform fee env parsing", () => {
  it("defaults percent and fixed when unset", () => {
    expect(getPlatformFeePercentFromEnv()).toEqual({ ok: true, value: 5, usingDefault: true })
    expect(getPlatformFeeFixedCentsFromEnv()).toEqual({ ok: true, value: 0, usingDefault: true })
  })

  it("rejects invalid env values", () => {
    vi.stubEnv("TICKET_PLATFORM_FEE_PERCENT", "bad")
    expect(getPlatformFeePercentFromEnv().ok).toBe(false)
    vi.stubEnv("TICKET_PLATFORM_FEE_FIXED_CENTS", "1.5")
    expect(getPlatformFeeFixedCentsFromEnv().ok).toBe(false)
  })
})
