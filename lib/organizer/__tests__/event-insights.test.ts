import { describe, expect, it } from "vitest"
import {
  buildOrganizerEventInsights,
  computeCheckInRate,
  computeConversionRate,
  formatInsightPercent,
} from "@/lib/organizer/event-insights"

describe("organizer event insights", () => {
  it("computes conversion rate from views and RSVPs", () => {
    expect(computeConversionRate(100, 10)).toBe(0.1)
    expect(computeConversionRate(0, 5)).toBeNull()
  })

  it("computes check-in rate", () => {
    expect(computeCheckInRate(20, 15)).toBe(0.75)
    expect(computeCheckInRate(0, 0)).toBeNull()
  })

  it("builds tips for low conversion", () => {
    const insight = buildOrganizerEventInsights({
      viewCount: 200,
      saveCount: 5,
      rsvpCount: 2,
      checkedInCount: 0,
    })
    expect(insight.tips.length).toBeGreaterThan(0)
    expect(formatInsightPercent(insight.conversionRate)).toBe("1%")
  })
})
