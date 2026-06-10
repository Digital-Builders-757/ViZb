import { describe, expect, it } from "vitest"

import { verifyErrorToCode } from "@/lib/checkin/scan-token-errors"

describe("verifyErrorToCode", () => {
  it("maps expired tokens", () => {
    expect(verifyErrorToCode("Token expired").code).toBe("token_expired")
  })

  it("maps invalid signature-style errors", () => {
    expect(verifyErrorToCode("Invalid signature").code).toBe("invalid_token")
  })
})
