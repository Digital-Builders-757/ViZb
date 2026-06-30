import { describe, expect, it } from "vitest"

import { calculateProfileCompletion } from "@/lib/profile/profile-completion"

describe("calculateProfileCompletion", () => {
  it("starts at 0 with every required field missing", () => {
    const result = calculateProfileCompletion(
      { display_name: null, avatar_url: null },
      { homeCities: [], categories: [] },
    )

    expect(result.pct).toBe(0)
    expect(result.label).toBe("Set up your vibe")
    expect(result.missingFields).toEqual(["Display name", "Profile picture", "Home city", "Event interests"])
  })

  it("weights display name, avatar, home cities, and categories evenly", () => {
    expect(
      calculateProfileCompletion(
        { display_name: "Maya", avatar_url: null },
        { homeCities: [], categories: [] },
      ).pct,
    ).toBe(25)

    expect(
      calculateProfileCompletion(
        { display_name: "Maya", avatar_url: "https://example.test/avatar.jpg" },
        { homeCities: ["norfolk"], categories: [] },
      ).pct,
    ).toBe(75)
  })

  it("reaches exactly 100 only when all requirements are complete", () => {
    const result = calculateProfileCompletion(
      { display_name: "Maya", avatar_url: "https://example.test/avatar.jpg" },
      { homeCities: ["norfolk"], categories: ["music"] },
    )

    expect(result.pct).toBe(100)
    expect(result.label).toBe("Profile complete")
    expect(result.missingFields).toEqual([])
  })
})
