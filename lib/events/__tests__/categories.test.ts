import { describe, it, expect } from "vitest"
import { parseCategoriesFromFormData, normalizeCategories, isValidEventCategory } from "../categories"

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
})

describe("normalizeCategories", () => {
  it("filters non-strings and dedupes", () => {
    expect(normalizeCategories(["party", "party", 1, "concert"])).toEqual(["party", "concert"])
  })

  it("handles non-array", () => {
    expect(normalizeCategories(null)).toEqual([])
  })
})

describe("isValidEventCategory", () => {
  it("accepts known values", () => {
    expect(isValidEventCategory("workshop")).toBe(true)
  })

  it("rejects unknown", () => {
    expect(isValidEventCategory("festival")).toBe(false)
  })
})
