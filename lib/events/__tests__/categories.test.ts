import { describe, it, expect } from "vitest"
import {
  isValidEventCategory,
  normalizeCategories,
  normalizeCategoriesForPersistence,
  normalizeValidEventCategories,
  parseCategoriesFromFormData,
} from "../categories"
import { formatCategoryLabel } from "../event-display-format"

describe("parseCategoriesFromFormData", () => {
  it("collects and dedupes checkbox values", () => {
    const fd = new FormData()
    fd.append("categories", "party")
    fd.append("categories", "concert")
    fd.append("categories", "party")
    expect(parseCategoriesFromFormData(fd)).toEqual(["party", "concert"])
  })

  it("returns null when none selected", () => {
    const fd = new FormData()
    expect(parseCategoriesFromFormData(fd)).toBeNull()
  })

  it("returns null for invalid slug", () => {
    const fd = new FormData()
    fd.append("categories", "not-a-real-category")
    expect(parseCategoriesFromFormData(fd)).toBeNull()
  })

  it("accepts open_mic and music", () => {
    const fd = new FormData()
    fd.append("categories", "open_mic")
    fd.append("categories", "music")
    expect(parseCategoriesFromFormData(fd)).toEqual(["open_mic", "music"])
  })
})

describe("normalizeCategories", () => {
  it("preserves arbitrary string values while filtering non-strings and deduping", () => {
    expect(normalizeCategories(["party", "party", 1, "Jazz"])).toEqual([
      "party",
      "Jazz",
    ])
  })

  it("handles non-array", () => {
    expect(normalizeCategories(null)).toEqual([])
  })
})

describe("normalizeValidEventCategories", () => {
  it("normalizes and filters to the ViZb taxonomy", () => {
    expect(normalizeValidEventCategories([" Party ", "party", "concert", "Jazz"])).toEqual([
      "party",
      "concert",
    ])
  })
})

describe("normalizeCategoriesForPersistence", () => {
  it("keeps valid categories", () => {
    expect(normalizeCategoriesForPersistence(["music", "concert"])).toEqual([
      "music",
      "concert",
    ])
  })

  it("falls back to other when an external taxonomy contains no valid categories", () => {
    expect(normalizeCategoriesForPersistence(["Music", "R&B", "Soul"])).toEqual(["music"])
    expect(normalizeCategoriesForPersistence(["Jazz", "R&B", "Soul"])).toEqual(["other"])
  })
})

describe("formatCategoryLabel", () => {
  it("formats open_mic as Open mic", () => {
    expect(formatCategoryLabel("open_mic")).toBe("Open mic")
  })
})

describe("isValidEventCategory", () => {
  it("accepts known values", () => {
    expect(isValidEventCategory("workshop")).toBe(true)
    expect(isValidEventCategory("open_mic")).toBe(true)
    expect(isValidEventCategory("music")).toBe(true)
  })

  it("rejects unknown", () => {
    expect(isValidEventCategory("festival")).toBe(false)
  })
})
