import { describe, expect, it } from "vitest"

import { calculateTicketCheckoutAmounts } from "@/lib/payments/ticket-fees"
import {
  assertOrderPaymentBreakdown,
  buildPaidOrderInsertRow,
  ORDER_PAYMENT_STATUS,
  ORDER_PAYOUT_STATUS,
} from "@/lib/orders/order-payment-fields"

describe("buildPaidOrderInsertRow", () => {
  it("stores canonical fee breakdown in integer cents", () => {
    const amounts = calculateTicketCheckoutAmounts(2_000)
    const row = buildPaidOrderInsertRow({
      userId: "user-1",
      eventId: "event-1",
      currency: "usd",
      amounts,
    })

    expect(row).toMatchObject({
      status: "pending_payment",
      ticket_subtotal_cents: 2_000,
      vizb_service_fee_cents: 200,
      processing_fee_cents: 97,
      buyer_total_cents: 2_297,
      organizer_payout_cents: 2_000,
      payment_status: ORDER_PAYMENT_STATUS.created,
      payout_status: ORDER_PAYOUT_STATUS.pending,
      subtotal_cents: 2_000,
      platform_fee_cents: 200,
      total_cents: 2_297,
    })
  })
})

describe("assertOrderPaymentBreakdown", () => {
  it("accepts a valid paid order breakdown", () => {
    const amounts = calculateTicketCheckoutAmounts(500)
    expect(
      assertOrderPaymentBreakdown({
        ticket_subtotal_cents: amounts.subtotalCents,
        vizb_service_fee_cents: amounts.platformFeeCents,
        processing_fee_cents: amounts.processingFeeCents,
        buyer_total_cents: amounts.totalCents,
        organizer_payout_cents: amounts.organizerPayoutCents,
      }),
    ).toEqual({ ok: true })
  })

  it("rejects mismatched buyer total", () => {
    const result = assertOrderPaymentBreakdown({
      ticket_subtotal_cents: 2_000,
      vizb_service_fee_cents: 200,
      processing_fee_cents: 97,
      buyer_total_cents: 999,
      organizer_payout_cents: 2_000,
    })
    expect("error" in result).toBe(true)
  })
})
