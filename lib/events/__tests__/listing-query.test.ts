import { describe, expect, it } from "vitest"

import {
  buildCityFilterOptions,
  cityMatchesFilter,
  hasVirginiaCitySuffix,
  normalizeCityLabel,
} from "@/lib/events/listing-query"

describe("normalizeCityLabel", () => {
  it("title-cases and trims city names", () => {
    expect(normalizeCityLabel("  norfolk  ")).toBe("Norfolk")
    expect(normalizeCityLabel("virginia beach")).toBe("Virginia Beach")
  })
})

describe("hasVirginiaCitySuffix", () => {
  it("matches comma-VA suffixes case-insensitively", () => {
    expect(hasVirginiaCitySuffix("Norfolk, Va")).toBe(true)
    expect(hasVirginiaCitySuffix("Norfolk, VA")).toBe(true)
    expect(hasVirginiaCitySuffix("Virginia Beach, Va")).toBe(true)
  })

  it("rejects labels without comma-VA suffix", () => {
    expect(hasVirginiaCitySuffix("Norfolk")).toBe(false)
    expect(hasVirginiaCitySuffix("Hampton VA")).toBe(false)
    expect(hasVirginiaCitySuffix("Chesapeake, Virginia")).toBe(false)
  })
})

describe("cityMatchesFilter", () => {
  it("matches event and filter cities across state suffix differences", () => {
    expect(cityMatchesFilter("Norfolk", "Norfolk, Va")).toBe(true)
    expect(cityMatchesFilter("norfolk, va", "Norfolk, VA")).toBe(true)
  })

  it("does not match unrelated cities", () => {
    expect(cityMatchesFilter("Portsmouth", "Norfolk, Va")).toBe(false)
    expect(cityMatchesFilter("Richmond", "Norfolk")).toBe(false)
  })
})

describe("buildCityFilterOptions", () => {
  it("dedupes cities that differ only by casing", () => {
    const options = buildCityFilterOptions([
      { city: "Norfolk, VA" },
      { city: "norfolk, va" },
      { city: "Virginia Beach, VA" },
    ])
    expect(options).toContain("Norfolk, Va")
    expect(options).toContain("Virginia Beach, Va")
    expect(options.filter((c) => c.toLowerCase().startsWith("norfolk")).length).toBe(1)
  })

  it("excludes cities without comma-VA suffix", () => {
    const options = buildCityFilterOptions([
      { city: "Norfolk" },
      { city: "Norfolk, VA" },
      { city: "Portsmouth" },
      { city: "Hampton VA" },
      { city: "Chesapeake, Virginia" },
    ])
    expect(options).toEqual(["Norfolk, Va"])
    expect(options).not.toContain("Norfolk")
    expect(options).not.toContain("Portsmouth")
  })
})
