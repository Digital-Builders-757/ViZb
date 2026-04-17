import { describe, it, expect } from "vitest"
import { eventHasOpenMicCategory } from "../open-mic"
import { PUBLIC_LINEUP_STATUSES } from "../lineup-entry-status"

describe("eventHasOpenMicCategory", () => {
  it("is true when open_mic is present", () => {
    expect(eventHasOpenMicCategory(["party", "open_mic"])).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(eventHasOpenMicCategory(["OPEN_MIC"])).toBe(true)
  })

  it("is false otherwise", () => {
    expect(eventHasOpenMicCategory(["concert"])).toBe(false)
  })
})

describe("PUBLIC_LINEUP_STATUSES", () => {
  it("matches public page filters", () => {
    expect(PUBLIC_LINEUP_STATUSES).toEqual(["confirmed", "performed"])
  })
})
