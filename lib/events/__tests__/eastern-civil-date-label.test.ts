import { describe, expect, it } from "vitest"
import { formatEasternCivilDayHeading } from "../eastern-civil-date-label"

describe("formatEasternCivilDayHeading", () => {
  it("formats a midsummer Eastern civil key without throwing", () => {
    const s = formatEasternCivilDayHeading("2026-07-15")
    expect(s).toContain("July")
    expect(s).toContain("15")
  })

  it("formats a winter Eastern civil key without throwing", () => {
    const s = formatEasternCivilDayHeading("2026-01-15")
    expect(s).toContain("January")
    expect(s).toContain("15")
  })

  it("returns the key for malformed input", () => {
    expect(formatEasternCivilDayHeading("not-a-date")).toBe("not-a-date")
  })
})
