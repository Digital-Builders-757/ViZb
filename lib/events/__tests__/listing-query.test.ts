import { describe, expect, it } from "vitest"

import { buildCityFilterOptions, normalizeCityLabel } from "@/lib/events/listing-query"

describe("normalizeCityLabel", () => {
  it("title-cases and trims city names", () => {
    expect(normalizeCityLabel("  norfolk  ")).toBe("Norfolk")
    expect(normalizeCityLabel("virginia beach")).toBe("Virginia Beach")
  })
})

describe("buildCityFilterOptions", () => {
  it("dedupes cities that differ only by casing", () => {
    const options = buildCityFilterOptions([
      { city: "Norfolk" },
      { city: "norfolk" },
      { city: "Virginia Beach" },
    ])
    expect(options).toContain("Norfolk")
    expect(options).toContain("Virginia Beach")
    expect(options.filter((c) => c.toLowerCase() === "norfolk")).toHaveLength(1)
  })
})
