import { describe, expect, it } from "vitest"
import { formatUsdFromCents, parseUsdStringToCents } from "@/lib/money/usd"

describe("parseUsdStringToCents", () => {
  it("parses whole dollars and cents", () => {
    expect(parseUsdStringToCents("")).toEqual({ cents: 0 })
    expect(parseUsdStringToCents("12")).toEqual({ cents: 1200 })
    expect(parseUsdStringToCents("12.5")).toEqual({ cents: 1250 })
    expect(parseUsdStringToCents("12.50")).toEqual({ cents: 1250 })
    expect(parseUsdStringToCents("0.01")).toEqual({ cents: 1 })
  })

  it("rejects bad input", () => {
    expect("error" in parseUsdStringToCents("12.345")).toBe(true)
    expect("error" in parseUsdStringToCents("-1")).toBe(true)
  })
})

describe("formatUsdFromCents", () => {
  it("formats currency", () => {
    expect(formatUsdFromCents(1099)).toContain("10")
    expect(formatUsdFromCents(1099)).toContain("99")
  })
})
