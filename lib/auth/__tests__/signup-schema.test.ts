import { describe, expect, it } from "vitest"

import { parseSignupForm, type SignupFormInput } from "@/lib/auth/signup-schema"

describe("signupFormSchema", () => {
  const base: SignupFormInput = {
    displayName: "Jordan",
    email: "jordan@example.com",
    password: "secret12",
    phone: "(757) 555-0123",
    referralSource: "",
  }

  it("accepts valid signup input without referral", () => {
    const result = parseSignupForm(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBe("(757) 555-0123")
      expect(result.data.referralSource).toBeUndefined()
    }
  })

  it("accepts referral source options", () => {
    const social = parseSignupForm({ ...base, referralSource: "social_media" })
    const google = parseSignupForm({ ...base, referralSource: "google" })

    expect(social.success).toBe(true)
    expect(google.success).toBe(true)
    if (social.success) expect(social.data.referralSource).toBe("social_media")
    if (google.success) expect(google.data.referralSource).toBe("google")
  })

  it("requires phone with at least 10 digits", () => {
    expect(parseSignupForm({ ...base, phone: "" }).success).toBe(false)
    expect(parseSignupForm({ ...base, phone: "12345" }).success).toBe(false)
    expect(parseSignupForm({ ...base, phone: "7575550123" }).success).toBe(true)
  })
})
