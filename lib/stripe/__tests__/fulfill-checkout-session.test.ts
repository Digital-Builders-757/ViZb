import { describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"
import {
  fulfillPaidCheckoutSession,
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

describe("fulfillPaidCheckoutSession", () => {
  it("rejects unpaid sessions", async () => {
    const admin = { rpc: vi.fn(), from: vi.fn() }
    const result = await fulfillPaidCheckoutSession(
      admin as never,
      session({ payment_status: "unpaid", id: "cs_1", metadata: { order_id: "o1" } }),
    )
    expect(result).toEqual({ ok: false, error: "Payment not completed." })
    expect(admin.rpc).not.toHaveBeenCalled()
  })

  it("calls fulfillment RPC for paid sessions", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "ticket-1", error: null })
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { slug: "event-slug" }, error: null }),
        }),
      }),
    })
    const admin = { rpc, from }
    const result = await fulfillPaidCheckoutSession(
      admin as never,
      session({
        payment_status: "paid",
        id: "cs_test_12345678",
        metadata: {
          order_id: "11111111-1111-4111-8111-111111111111",
          event_id: "22222222-2222-2222-2222-222222222222",
        },
        amount_total: 2100,
        currency: "usd",
        payment_intent: "pi_test",
      }),
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.ticketId).toBe("ticket-1")
      expect(result.eventSlug).toBe("event-slug")
    }
    expect(rpc).toHaveBeenCalledWith("fulfill_stripe_ticket_order", expect.objectContaining({
      p_stripe_checkout_session_id: "cs_test_12345678",
    }))
  })

  it("can be invoked repeatedly for the same paid session (RPC idempotency)", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "ticket-1", error: null })
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { slug: "event-slug" }, error: null }),
        }),
      }),
    })
    const admin = { rpc, from }
    const paidSession = session({
      payment_status: "paid",
      id: "cs_test_12345678",
      metadata: {
        order_id: "11111111-1111-4111-8111-111111111111",
        event_id: "22222222-2222-2222-2222-222222222222",
      },
      amount_total: 2100,
      currency: "usd",
    })

    const first = await fulfillPaidCheckoutSession(admin as never, paidSession)
    const second = await fulfillPaidCheckoutSession(admin as never, paidSession)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(rpc).toHaveBeenCalledTimes(2)
  })
})
