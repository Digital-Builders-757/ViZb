import { describe, expect, it } from "vitest"

import {
  assertNativeTicketingAllowed,
  NATIVE_TICKETING_CLAIM_REQUIRED_MESSAGE,
} from "@/lib/events/native-ticketing-guard"

describe("assertNativeTicketingAllowed", () => {
  it("allows native official events", () => {
    expect(assertNativeTicketingAllowed({ event_kind: "official", source: null, import_status: null })).toEqual({
      ok: true,
    })
  })

  it("blocks community listings", () => {
    expect(assertNativeTicketingAllowed({ event_kind: "community" })).toEqual({
      ok: false,
      error: NATIVE_TICKETING_CLAIM_REQUIRED_MESSAGE,
    })
  })

  it("blocks imported listings even if event_kind is missing", () => {
    expect(assertNativeTicketingAllowed({ source: "ticketmaster", import_status: "approved" })).toEqual({
      ok: false,
      error: NATIVE_TICKETING_CLAIM_REQUIRED_MESSAGE,
    })
  })
})
