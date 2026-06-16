import { describe, it, expect } from "vitest"
import { advertiseInquirySchema } from "../advertise-contact-schema"

describe("advertiseInquirySchema", () => {
  const validBase = {
    fullName: "Jordan Lee",
    email: "jordan@example.com",
    company: "",
    phone: "",
    interestType: "sponsorship" as const,
    budgetRange: "",
    message:
      "We are launching a summer series in Norfolk and want to sponsor your newsletter and onsite placements for June–August.",
    companyWebsite: "",
  }

  it("accepts a complete valid payload", () => {
    const r = advertiseInquirySchema.safeParse(validBase)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.company).toBeUndefined()
      expect(r.data.budgetRange).toBeUndefined()
    }
  })

  it("rejects short message with expected error copy", () => {
    const r = advertiseInquirySchema.safeParse({ ...validBase, message: "too short" })
    expect(r.success).toBe(false)
    if (!r.success) {
      const messageIssue = r.error.issues.find((issue) => issue.path[0] === "message")
      expect(messageIssue?.message).toBe("Tell us a bit more — at least a few sentences (40+ characters).")
    }
  })

  it("rejects filled honeypot", () => {
    const r = advertiseInquirySchema.safeParse({ ...validBase, companyWebsite: "https://spam.com" })
    expect(r.success).toBe(false)
  })

  it("maps budget selection", () => {
    const r = advertiseInquirySchema.safeParse({
      ...validBase,
      budgetRange: "500_2500",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.budgetRange).toBe("500_2500")
  })
})
