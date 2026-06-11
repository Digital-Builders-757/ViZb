import { describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"
import {
  fulfillPaidCheckoutSession,
  lookupTicketIdForOrder,
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
    const ticketId = "55555555-5555-4555-8555-555555555555"
    const rpc = vi.fn().mockResolvedValue({ data: ticketId, error: null })
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
      expect(result.ticketId).toBe(ticketId)
      expect(result.eventSlug).toBe("event-slug")
    }
    expect(rpc).toHaveBeenCalledWith("fulfill_stripe_ticket_order", expect.objectContaining({
      p_stripe_checkout_session_id: "cs_test_12345678",
    }))
  })

  it("can be invoked repeatedly for the same paid session (RPC idempotency)", async () => {
    const ticketId = "55555555-5555-4555-8555-555555555555"
    const rpc = vi.fn().mockResolvedValue({ data: ticketId, error: null })
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

  it("falls back to tickets lookup when RPC succeeds without a ticket id", async () => {
    const orderId = "11111111-1111-4111-8111-111111111111"
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const ticketLookup = vi.fn().mockResolvedValue({ data: { id: "33333333-3333-4333-8333-333333333333" }, error: null })
    const from = vi.fn((table: string) => {
      if (table === "tickets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: ticketLookup,
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { slug: "event-slug" }, error: null }),
          }),
        }),
      }
    })
    const admin = { rpc, from }
    const result = await fulfillPaidCheckoutSession(
      admin as never,
      session({
        payment_status: "paid",
        id: "cs_test_12345678",
        metadata: { order_id: orderId, event_id: "22222222-2222-2222-2222-222222222222" },
        amount_total: 2100,
        currency: "usd",
      }),
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.ticketId).toBe("33333333-3333-4333-8333-333333333333")
    }
    expect(ticketLookup).toHaveBeenCalled()
  })
})

describe("lookupTicketIdForOrder", () => {
  it("returns ticket id from order lookup", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "44444444-4444-4444-8444-444444444444" },
      error: null,
    })
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
    }
    const id = await lookupTicketIdForOrder(admin as never, "11111111-1111-4111-8111-111111111111")
    expect(id).toBe("44444444-4444-4444-8444-444444444444")
  })
})
