import { describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"

import {
  assertOrderFeeFields,
  refundStatusFromAmounts,
  type OrderPaymentRow,
} from "@/lib/stripe/webhook-order-lookup"
import { claimStripeEventForProcessing } from "@/lib/stripe/webhook-idempotency"
import { handleStripeWebhookEvent } from "@/lib/stripe/webhook-handlers"

function baseOrder(overrides: Partial<OrderPaymentRow> = {}): OrderPaymentRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    event_id: "22222222-2222-4222-8222-222222222222",
    status: "pending_payment",
    ticket_subtotal_cents: 2000,
    vizb_service_fee_cents: 200,
    processing_fee_cents: 97,
    buyer_total_cents: 2297,
    organizer_payout_cents: 2000,
    payment_status: "checkout_started",
    payout_status: "pending",
    subtotal_cents: 2000,
    platform_fee_cents: 200,
    total_cents: 2297,
    stripe_checkout_session_id: "cs_test_12345678",
    stripe_payment_intent_id: "pi_test",
    stripe_charge_id: "ch_test",
    refund_status: "none",
    dispute_status: "none",
    payout_blocked: false,
    payout_blocked_reason: null,
    payout_released_at: null,
    ...overrides,
  }
}

describe("assertOrderFeeFields", () => {
  it("accepts valid fee breakdown", () => {
    expect(assertOrderFeeFields(baseOrder())).toEqual({ ok: true })
  })

  it("rejects mismatched totals", () => {
    const result = assertOrderFeeFields(baseOrder({ buyer_total_cents: 9999, total_cents: 9999 }))
    expect(result.ok).toBe(false)
  })
})

describe("refundStatusFromAmounts", () => {
  it("returns full when amount fully refunded", () => {
    expect(refundStatusFromAmounts(2297, 2297)).toBe("full")
  })

  it("returns partial for partial refund", () => {
    expect(refundStatusFromAmounts(500, 2297)).toBe("partial")
  })
})

describe("claimStripeEventForProcessing", () => {
  it("returns alreadyProcessed when event id exists", async () => {
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "row-1", result: "processed" }, error: null }),
          }),
        }),
      }),
    }

    const result = await claimStripeEventForProcessing(admin as never, {
      id: "evt_123",
      type: "checkout.session.completed",
    } as Stripe.Event)

    expect(result).toEqual({ alreadyProcessed: true, stripeEventId: "evt_123" })
  })

  it("allows retry when prior result was failed", async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "row-1", result: "failed" },
              error: null,
            }),
          }),
        }),
        update,
        insert: vi.fn(),
      }),
    }

    const result = await claimStripeEventForProcessing(admin as never, {
      id: "evt_retry",
      type: "payment_intent.succeeded",
    } as Stripe.Event)

    expect(result).toEqual({ alreadyProcessed: false, recordId: "row-1" })
    expect(update).toHaveBeenCalled()
  })
})

function payoutTableMock() {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null }),
        is: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }
}

describe("handleStripeWebhookEvent", () => {
  it("blocks payout on charge.refunded when payout not released", async () => {
    const order = baseOrder({ status: "completed", payout_released_at: null })
    const orderUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const ticketUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const from = vi.fn((table: string) => {
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
            }),
          }),
          update: orderUpdate,
        }
      }
      if (table === "tickets") {
        return {
          update: ticketUpdate,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { slug: "refund-event" }, error: null }),
            }),
          }),
        }
      }
      if (table === "organizer_payouts") {
        return payoutTableMock()
      }
      return { select: vi.fn(), update: vi.fn() }
    })

    const admin = { from, rpc: vi.fn() }

    const result = await handleStripeWebhookEvent(admin as never, {
      id: "evt_refund",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_test",
          amount: 2297,
          amount_refunded: 2297,
          payment_intent: "pi_test",
          metadata: { order_id: order.id },
        },
      },
    } as unknown as Stripe.Event)

    expect(result.orderId).toBe(order.id)
    expect(orderUpdate).toHaveBeenCalled()
    const refundUpdate = orderUpdate.mock.calls.find(([payload]) => payload.refund_status === "full")?.[0]
    expect(refundUpdate).toMatchObject({
      payout_blocked: true,
      payout_blocked_reason: "refund",
      refund_status: "full",
      status: "refunded",
    })
  })

  it("blocks payout immediately on charge.dispute.created", async () => {
    const order = baseOrder({ status: "completed" })
    const orderUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })

    const from = vi.fn((table: string) => {
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
            }),
          }),
          update: orderUpdate,
        }
      }
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { slug: "dispute-event" }, error: null }),
            }),
          }),
        }
      }
      if (table === "organizer_payouts") {
        return payoutTableMock()
      }
      return { select: vi.fn(), update: vi.fn() }
    })

    const admin = { from, rpc: vi.fn() }

    await handleStripeWebhookEvent(admin as never, {
      id: "evt_dispute",
      type: "charge.dispute.created",
      data: {
        object: {
          id: "dp_test",
          charge: "ch_test",
          status: "needs_response",
        },
      },
    } as unknown as Stripe.Event)

    expect(orderUpdate).toHaveBeenCalled()
    const disputeUpdate = orderUpdate.mock.calls.find(([payload]) => payload.dispute_status === "disputed")?.[0]
    expect(disputeUpdate).toMatchObject({
      dispute_status: "disputed",
      payout_blocked: true,
      payout_blocked_reason: "dispute",
      payout_status: "blocked",
    })
  })
})
