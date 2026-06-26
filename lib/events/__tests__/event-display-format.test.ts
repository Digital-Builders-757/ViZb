import { describe, expect, it } from "vitest"

import {
  formatEventDateTimeCompactWithZone,
  formatEventStartLabelWithZone,
  formatEventTimeRangeWithZone,
  formatEventTimeWithZone,
} from "../event-display-format"

describe("event display timezone labels", () => {
  it("uses EST as the product-facing label for summer Eastern times", () => {
    expect(formatEventTimeWithZone("2026-07-01T23:00:00.000Z")).toBe("7:00 PM EST")
    expect(formatEventStartLabelWithZone("2026-07-01T23:00:00.000Z")).toBe(
      "Wed, Jul 1, 7:00 PM EST",
    )
  })

  it("formats ranges and compact labels with the EST suffix", () => {
    expect(
      formatEventTimeRangeWithZone("2026-07-01T23:00:00.000Z", "2026-07-02T01:30:00.000Z"),
    ).toBe("7:00 PM - 9:30 PM EST")
    expect(formatEventDateTimeCompactWithZone("2026-01-16T00:00:00.000Z")).toBe(
      "Thu, Jan 15, 7:00 PM EST",
    )
  })
})
