import { describe, it, expect } from "vitest"
import { parseRsvpCapacityField, parseRsvpCapacityValue } from "../rsvp-capacity"

function fd(cap: string | null | undefined): FormData {
  const form = new FormData()
  if (cap !== undefined) form.set("rsvp_capacity", cap ?? "")
  return form
}

describe("parseRsvpCapacityValue", () => {
  it("treats null and empty as unlimited", () => {
    expect(parseRsvpCapacityValue(null)).toEqual({ capacity: null })
    expect(parseRsvpCapacityValue("")).toEqual({ capacity: null })
    expect(parseRsvpCapacityValue("   ")).toEqual({ capacity: null })
  })

  it("parses valid positive integers", () => {
    expect(parseRsvpCapacityValue("1")).toEqual({ capacity: 1 })
    expect(parseRsvpCapacityValue("250")).toEqual({ capacity: 250 })
    expect(parseRsvpCapacityValue(" 42 ")).toEqual({ capacity: 42 })
  })

  it("rejects zero, negative, and non-numeric", () => {
    for (const raw of ["0", "-1", "abc"]) {
      const r = parseRsvpCapacityValue(raw)
      expect(r.error).toBeDefined()
      expect(r.capacity).toBeNull()
    }
  })

  it("parses leading integer from decimal input (parseInt behavior)", () => {
    expect(parseRsvpCapacityValue("12.5")).toEqual({ capacity: 12 })
  })

  it("rejects caps above 1_000_000", () => {
    const r = parseRsvpCapacityValue("1000001")
    expect(r.error).toBe("RSVP cap is too large.")
    expect(r.capacity).toBeNull()
  })

  it("accepts exactly 1_000_000", () => {
    expect(parseRsvpCapacityValue("1000000")).toEqual({ capacity: 1_000_000 })
  })
})

describe("parseRsvpCapacityField", () => {
  it("reads rsvp_capacity from FormData", () => {
    expect(parseRsvpCapacityField(fd(""))).toEqual({ capacity: null })
    expect(parseRsvpCapacityField(fd("99"))).toEqual({ capacity: 99 })
  })

  it("treats missing key as unlimited", () => {
    expect(parseRsvpCapacityField(new FormData())).toEqual({ capacity: null })
  })
})
