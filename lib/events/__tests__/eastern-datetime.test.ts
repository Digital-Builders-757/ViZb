import { describe, expect, it } from "vitest"
import {
  easternCivilDateKeyDiffDays,
  easternCivilDateKeyToDate,
  easternDateKeyFromIso,
  formatIsoToEasternDatetimeLocal,
  parseEasternDatetimeLocalToIso,
  reinterpretUtcComponentsAsEasternToIso,
} from "../eastern-datetime"

describe("parseEasternDatetimeLocalToIso", () => {
  it("converts Eastern summer wall time to UTC (EDT, UTC-4)", () => {
    expect(parseEasternDatetimeLocalToIso("2026-07-01T19:00")).toBe("2026-07-01T23:00:00.000Z")
  })

  it("converts Eastern winter wall time to UTC (EST, UTC-5)", () => {
    expect(parseEasternDatetimeLocalToIso("2026-01-15T19:00")).toBe("2026-01-16T00:00:00.000Z")
  })

  it("passes through full ISO strings with Z", () => {
    expect(parseEasternDatetimeLocalToIso("2026-07-01T23:00:00.000Z")).toBe("2026-07-01T23:00:00.000Z")
  })

  it("returns null for invalid input", () => {
    expect(parseEasternDatetimeLocalToIso("")).toBeNull()
    expect(parseEasternDatetimeLocalToIso("not-a-date")).toBeNull()
  })
})

describe("formatIsoToEasternDatetimeLocal", () => {
  it("round-trips summer Eastern time", () => {
    const iso = "2026-07-01T23:00:00.000Z"
    expect(formatIsoToEasternDatetimeLocal(iso)).toBe("2026-07-01T19:00")
    expect(parseEasternDatetimeLocalToIso(formatIsoToEasternDatetimeLocal(iso))).toBe(iso)
  })

  it("round-trips winter Eastern time", () => {
    const iso = "2026-01-16T00:00:00.000Z"
    expect(formatIsoToEasternDatetimeLocal(iso)).toBe("2026-01-15T19:00")
  })
})

describe("easternDateKeyFromIso", () => {
  it("returns Eastern civil date for a late-night UTC instant", () => {
    expect(easternDateKeyFromIso("2026-07-02T02:00:00.000Z")).toBe("2026-07-01")
  })
})

describe("reinterpretUtcComponentsAsEasternToIso", () => {
  it("shifts naive UTC-stored organizer time to true Eastern UTC", () => {
    const wrong = "2026-07-01T19:00:00.000Z"
    expect(reinterpretUtcComponentsAsEasternToIso(wrong)).toBe("2026-07-01T23:00:00.000Z")
  })
})

describe("easternCivilDateKey helpers", () => {
  it("computes day diff between Eastern civil keys", () => {
    expect(easternCivilDateKeyDiffDays("2026-07-01", "2026-07-02")).toBe(1)
    expect(easternCivilDateKeyDiffDays("2026-07-01", "2026-07-01")).toBe(0)
  })

  it("creates a stable noon UTC anchor for formatting", () => {
    const d = easternCivilDateKeyToDate("2026-07-15")
    expect(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        month: "long",
        day: "numeric",
      }).format(d),
    ).toContain("15")
  })
})
