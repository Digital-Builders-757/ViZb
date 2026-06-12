import { describe, expect, it } from "vitest"

import {
  formatPostPublishedDate,
  getPostCardKicker,
  postCardKickerLabel,
} from "@/lib/posts/display"

describe("formatPostPublishedDate", () => {
  it("formats valid ISO dates", () => {
    expect(formatPostPublishedDate("2026-06-12T18:00:00.000Z")).toMatch(/Jun/)
  })

  it("returns null for missing values", () => {
    expect(formatPostPublishedDate(null)).toBeNull()
    expect(formatPostPublishedDate("")).toBeNull()
  })
})

describe("post card kicker", () => {
  it("labels recaps and updates distinctly", () => {
    expect(postCardKickerLabel(getPostCardKicker(true))).toBe("Event recap")
    expect(postCardKickerLabel(getPostCardKicker(false))).toBe("Update")
  })
})
