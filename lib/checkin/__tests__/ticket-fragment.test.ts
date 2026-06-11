import { describe, expect, it } from "vitest"

import { formatRegistrationTicketFragment } from "@/lib/checkin/ticket-fragment"

describe("formatRegistrationTicketFragment", () => {
  it("returns the last 8 hex chars of the registration id", () => {
    expect(formatRegistrationTicketFragment("22222222-2222-4222-8222-222222222222")).toBe("22222222")
  })
})
