import { describe, it, expect } from "vitest"
import {
  getLineupEntryPublicVisibilityPresentation,
  isLineupEntryOnPublicPage,
} from "../lineup-entry-status"

describe("isLineupEntryOnPublicPage", () => {
  it("is true only for public confirmed and performed", () => {
    expect(isLineupEntryOnPublicPage({ status: "confirmed", is_public: true })).toBe(true)
    expect(isLineupEntryOnPublicPage({ status: "performed", is_public: true })).toBe(true)
    expect(isLineupEntryOnPublicPage({ status: "CONFIRMED", is_public: true })).toBe(true)
  })

  it("is false when not public or status is not public-eligible", () => {
    expect(isLineupEntryOnPublicPage({ status: "confirmed", is_public: false })).toBe(false)
    expect(isLineupEntryOnPublicPage({ status: "pending", is_public: true })).toBe(false)
    expect(isLineupEntryOnPublicPage({ status: "no_show", is_public: true })).toBe(false)
    expect(isLineupEntryOnPublicPage({ status: "cancelled", is_public: true })).toBe(false)
  })
})

describe("getLineupEntryPublicVisibilityPresentation", () => {
  it("labels visible rows", () => {
    expect(getLineupEntryPublicVisibilityPresentation({ status: "confirmed", is_public: true })).toEqual({
      label: "Visible on public lineup",
      tone: "on_public",
    })
  })

  it("labels public off before pending wording", () => {
    expect(getLineupEntryPublicVisibilityPresentation({ status: "pending", is_public: false })).toEqual({
      label: "Public off",
      tone: "muted",
    })
  })

  it("labels pending when public but not confirmed", () => {
    expect(getLineupEntryPublicVisibilityPresentation({ status: "pending", is_public: true })).toEqual({
      label: "Pending — not on public lineup yet",
      tone: "muted",
    })
  })

  it("labels no-show", () => {
    expect(getLineupEntryPublicVisibilityPresentation({ status: "no_show", is_public: true })).toEqual({
      label: "No-show — not on public lineup",
      tone: "caution",
    })
  })

  it("labels cancelled", () => {
    expect(getLineupEntryPublicVisibilityPresentation({ status: "cancelled", is_public: true })).toEqual({
      label: "Cancelled — not on public lineup",
      tone: "muted",
    })
  })
})
