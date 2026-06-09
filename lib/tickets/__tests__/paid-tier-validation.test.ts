import { describe, expect, it } from "vitest"
import {
  MIN_PAID_TICKET_CENTS,
  parsePaidTierPriceUsd,
  validatePaidTierPriceCents,
} from "@/lib/tickets/paid-tier-validation"

describe("validatePaidTierPriceCents", () => {
  it("accepts zero (free tier)", () => {
    expect(validatePaidTierPriceCents(0)).toEqual({ ok: true })
  })

  it("accepts minimum paid price", () => {
    expect(validatePaidTierPriceCents(MIN_PAID_TICKET_CENTS)).toEqual({ ok: true })
    expect(validatePaidTierPriceCents(500)).toEqual({ ok: true })
  })

  it("rejects paid prices below minimum", () => {
    expect(validatePaidTierPriceCents(1)).toEqual({
      error: "Paid ticket price must be at least $0.50.",
    })
    expect(validatePaidTierPriceCents(49)).toEqual({
      error: "Paid ticket price must be at least $0.50.",
    })
  })

  it("rejects negative amounts", () => {
    expect(validatePaidTierPriceCents(-1)).toEqual({
      error: "Price must be a valid non-negative amount.",
    })
  })
})

describe("parsePaidTierPriceUsd", () => {
  it("parses valid paid amounts", () => {
    expect(parsePaidTierPriceUsd("5.00")).toEqual({ cents: 500 })
    expect(parsePaidTierPriceUsd("0.50")).toEqual({ cents: 50 })
  })

  it("rejects amounts below minimum for paid tiers", () => {
    expect("error" in parsePaidTierPriceUsd("0.01")).toBe(true)
    expect("error" in parsePaidTierPriceUsd("0.49")).toBe(true)
  })

  it("rejects malformed input", () => {
    expect("error" in parsePaidTierPriceUsd("abc")).toBe(true)
    expect("error" in parsePaidTierPriceUsd("-1")).toBe(true)
  })
})
