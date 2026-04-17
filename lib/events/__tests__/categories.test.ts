import { describe, it, expect } from "vitest"
import { parseCategoriesFromFormData, normalizeCategories, isValidEventCategory } from "../categories"
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

  it("accepts open_mic", () => {
    const fd = new FormData()
    fd.append("categories", "open_mic")
    expect(parseCategoriesFromFormData(fd)).toEqual(["open_mic"])
  })
})

describe("normalizeCategories", () => {
  it("filters non-strings and dedupes", () => {
    expect(normalizeCategories(["party", "party", 1, "concert"])).toEqual(["party", "concert"])
  })

  it("handles non-array", () => {
    expect(normalizeCategories(null)).toEqual([])
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
  })

  it("rejects unknown", () => {
    expect(isValidEventCategory("festival")).toBe(false)
  })
})
