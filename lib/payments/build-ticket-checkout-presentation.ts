import type { TicketCheckoutAmounts } from "@/lib/payments/ticket-fees"

export type TicketCheckoutLineItem = {
  quantity: number
  price_data: {
    currency: string
    unit_amount: number
    product_data: {
      name: string
    }
  }
}

export type TicketCheckoutPresentationInput = {
  eventTitle: string
  ticketTierName: string
  currency: string
  amounts: TicketCheckoutAmounts
}

export type TicketCheckoutStripeContext = {
  orderId: string
  eventId: string
  organizerId: string | null
  ticketTypeId: string
  userId: string
  amounts: TicketCheckoutAmounts
}

/** Stripe Checkout line items aligned with the in-app buyer preview. */
export function buildTicketCheckoutLineItems(
  input: TicketCheckoutPresentationInput,
): TicketCheckoutLineItem[] {
  const { eventTitle, ticketTierName, currency, amounts } = input

  return [
    {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amounts.subtotalCents,
        product_data: {
          name: `${eventTitle}, ${ticketTierName}`,
        },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amounts.platformFeeCents,
        product_data: {
          name: `ViZb service fee, ${eventTitle}`,
        },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amounts.processingFeeCents,
        product_data: {
          name: `Payment processing fee, ${eventTitle}`,
        },
      },
    },
  ]
}

export function sumTicketCheckoutLineItemCents(lineItems: TicketCheckoutLineItem[]): number {
  return lineItems.reduce((sum, item) => {
    const unitAmount = item.price_data.unit_amount
    const quantity = item.quantity
    return sum + unitAmount * quantity
  }, 0)
}

export function assertStripeLineItemsMatchBuyerTotal(
  lineItems: TicketCheckoutLineItem[],
  buyerTotalCents: number,
): { ok: true } | { error: string } {
  const lineItemTotalCents = sumTicketCheckoutLineItemCents(lineItems)
  if (lineItemTotalCents !== buyerTotalCents) {
    return {
      error: `Stripe line items total (${lineItemTotalCents}¢) does not match buyer total (${buyerTotalCents}¢).`,
    }
  }
  return { ok: true }
}

/** Money + routing metadata copied to Checkout Session and PaymentIntent. */
export function buildTicketCheckoutMetadata(
  context: TicketCheckoutStripeContext,
): Record<string, string> {
  const { amounts } = context

  const metadata: Record<string, string> = {
    order_id: context.orderId,
    event_id: context.eventId,
    ticket_type_id: context.ticketTypeId,
    user_id: context.userId,
    ticket_subtotal_cents: String(amounts.subtotalCents),
    vizb_service_fee_cents: String(amounts.platformFeeCents),
    processing_fee_cents: String(amounts.processingFeeCents),
    buyer_total_cents: String(amounts.totalCents),
    organizer_payout_cents: String(amounts.organizerPayoutCents),
  }

  if (context.organizerId) {
    metadata.organizer_id = context.organizerId
  }

  return metadata
}
