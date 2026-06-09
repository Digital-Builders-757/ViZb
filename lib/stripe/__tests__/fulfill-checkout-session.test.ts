import { describe, expect, it } from "vitest"
import type Stripe from "stripe"
import {
  readCheckoutSessionEventId,
  readCheckoutSessionOrderId,
  readCheckoutSessionUserId,
} from "@/lib/stripe/fulfill-checkout-session"

function session(partial: Partial<Stripe.Checkout.Session>): Stripe.Checkout.Session {
  return partial as Stripe.Checkout.Session
}

describe("readCheckoutSessionOrderId", () => {
  it("reads order_id from session metadata", () => {
    expect(
      readCheckoutSessionOrderId(
        session({ metadata: { order_id: "11111111-1111-4111-8111-111111111111" } }),
      ),
    ).toBe("11111111-1111-4111-8111-111111111111")
  })

  it("returns null when metadata missing", () => {
    expect(readCheckoutSessionOrderId(session({ metadata: {} }))).toBeNull()
  })
})

describe("readCheckoutSessionUserId", () => {
  it("prefers metadata user_id over client_reference_id", () => {
    expect(
      readCheckoutSessionUserId(
        session({
          metadata: { user_id: "aaaa" },
          client_reference_id: "bbbb",
        }),
      ),
    ).toBe("aaaa")
  })

  it("falls back to client_reference_id", () => {
    expect(readCheckoutSessionUserId(session({ client_reference_id: "bbbb" }))).toBe("bbbb")
  })
})

describe("readCheckoutSessionEventId", () => {
  it("reads event_id from metadata", () => {
    expect(readCheckoutSessionEventId(session({ metadata: { event_id: "evt-1" } }))).toBe("evt-1")
  })
})
