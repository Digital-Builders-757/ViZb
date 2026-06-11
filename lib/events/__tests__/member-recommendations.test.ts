import { describe, expect, it } from "vitest"
import {
  hasPersonalizationSignals,
  rankEventsForMember,
  scoreEventForMember,
  type RecommendationContext,
} from "@/lib/events/member-recommendations"

const baseEvent = {
  id: "e1",
  title: "Test",
  slug: "test",
  starts_at: "2026-06-15T20:00:00.000Z",
  ends_at: null,
  venue_name: "Venue",
  city: "Norfolk",
  categories: ["party"],
  flyer_url: null,
}

describe("member recommendations", () => {
  const ctx: RecommendationContext = {
    preferenceCategories: ["party"],
    preferenceHomeCities: ["norfolk"],
    savedCategories: ["concert"],
    rsvpCategories: [],
  }

  it("scores category and city matches", () => {
    const scored = scoreEventForMember(baseEvent, ctx)
    expect(scored.score).toBeGreaterThan(0)
    expect(scored.reasons).toContain("Matches your categories")
    expect(scored.reasons).toContain("Near your cities")
  })

  it("ranks staff picks and preference matches higher", () => {
    const events = [
      baseEvent,
      {
        ...baseEvent,
        id: "e2",
        slug: "other",
        city: "Atlanta",
        categories: ["other"],
        is_staff_pick: true,
      },
    ]
    const ranked = rankEventsForMember(events, ctx, 2)
    expect(ranked[0]?.id).toBe("e1")
  })

  it("detects personalization signals", () => {
    expect(hasPersonalizationSignals({ ...ctx, preferenceCategories: [] })).toBe(true)
    expect(
      hasPersonalizationSignals({
        preferenceCategories: [],
        preferenceHomeCities: [],
        savedCategories: [],
        rsvpCategories: [],
      }),
    ).toBe(false)
  })

  it("fallback pool can still return soon events", () => {
    const ranked = rankEventsForMember(
      [{ ...baseEvent, is_staff_pick: true }],
      {
        preferenceCategories: [],
        preferenceHomeCities: [],
        savedCategories: [],
        rsvpCategories: [],
      },
      1,
    )
    expect(ranked).toHaveLength(1)
    expect(ranked[0]?.reasons).toContain("ViZb pick")
  })
})
