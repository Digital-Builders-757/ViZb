import { describe, expect, it } from "vitest"

import {
  assertStripeLineItemsMatchBuyerTotal,
  buildTicketCheckoutLineItems,
  buildTicketCheckoutMetadata,
  sumTicketCheckoutLineItemCents,
} from "@/lib/payments/build-ticket-checkout-presentation"
import { calculateTicketCheckoutAmounts } from "@/lib/payments/ticket-fees"

const ORDER_ID = "11111111-1111-4111-8111-111111111111"
const EVENT_ID = "22222222-2222-4222-8222-222222222222"
const ORGANIZER_ID = "33333333-3333-4333-8333-333333333333"
const TIER_ID = "44444444-4444-4444-8444-444444444444"
const USER_ID = "55555555-5555-4555-8555-555555555555"

describe("buildTicketCheckoutLineItems", () => {
  it("builds three line items that sum to buyer total for a $20 ticket", () => {
    const amounts = calculateTicketCheckoutAmounts(2_000)
    const lineItems = buildTicketCheckoutLineItems({
      eventTitle: "Live Night",
      ticketTierName: "GA",
      currency: "usd",
      amounts,
    })

    expect(lineItems).toHaveLength(3)
    expect(lineItems[0].price_data.unit_amount).toBe(2_000)
    expect(lineItems[1].price_data.unit_amount).toBe(200)
    expect(lineItems[2].price_data.unit_amount).toBe(97)
    expect(lineItems[0].price_data.product_data.name).toBe("Live Night, GA")
    expect(lineItems[1].price_data.product_data.name).toBe("ViZb service fee, Live Night")
    expect(lineItems[2].price_data.product_data.name).toBe("Payment processing fee, Live Night")
    expect(sumTicketCheckoutLineItemCents(lineItems)).toBe(amounts.totalCents)
    expect(assertStripeLineItemsMatchBuyerTotal(lineItems, amounts.totalCents)).toEqual({ ok: true })
  })

  it("matches buyer total across launch price points", () => {
    for (const priceCents of [500, 1_000, 2_000, 5_000, 10_000]) {
      const amounts = calculateTicketCheckoutAmounts(priceCents)
      const lineItems = buildTicketCheckoutLineItems({
        eventTitle: "Test Event",
        ticketTierName: "General Admission",
        currency: "usd",
        amounts,
      })
      expect(sumTicketCheckoutLineItemCents(lineItems)).toBe(amounts.totalCents)
    }
  })
})

describe("buildTicketCheckoutMetadata", () => {
  it("includes required money fields and organizer id", () => {
    const amounts = calculateTicketCheckoutAmounts(2_000)
    const metadata = buildTicketCheckoutMetadata({
      orderId: ORDER_ID,
      eventId: EVENT_ID,
      organizerId: ORGANIZER_ID,
      ticketTypeId: TIER_ID,
      userId: USER_ID,
      amounts,
    })

    expect(metadata).toMatchObject({
      order_id: ORDER_ID,
      event_id: EVENT_ID,
      organizer_id: ORGANIZER_ID,
      ticket_type_id: TIER_ID,
      user_id: USER_ID,
      ticket_subtotal_cents: "2000",
      vizb_service_fee_cents: "200",
      processing_fee_cents: "97",
      buyer_total_cents: "2297",
      organizer_payout_cents: "2000",
    })
  })

  it("omits organizer_id when unknown", () => {
    const metadata = buildTicketCheckoutMetadata({
      orderId: ORDER_ID,
      eventId: EVENT_ID,
      organizerId: null,
      ticketTypeId: TIER_ID,
      userId: USER_ID,
      amounts: calculateTicketCheckoutAmounts(500),
    })

    expect(metadata.organizer_id).toBeUndefined()
  })
})

describe("assertStripeLineItemsMatchBuyerTotal", () => {
  it("rejects mismatched totals", () => {
    const amounts = calculateTicketCheckoutAmounts(2_000)
    const lineItems = buildTicketCheckoutLineItems({
      eventTitle: "Live Night",
      ticketTierName: "GA",
      currency: "usd",
      amounts,
    })
    lineItems[2].price_data.unit_amount -= 1

    const result = assertStripeLineItemsMatchBuyerTotal(lineItems, amounts.totalCents)
    expect("error" in result).toBe(true)
    if ("error" in result) {
      expect(result.error).toMatch(/does not match buyer total/)
    }
  })
})
