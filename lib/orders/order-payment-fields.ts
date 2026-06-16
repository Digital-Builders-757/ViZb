import type { TicketCheckoutAmounts } from "@/lib/payments/ticket-fees"

/** Buyer payment lifecycle stored on public.orders.payment_status */
export const ORDER_PAYMENT_STATUS = {
  created: "created",
  checkoutStarted: "checkout_started",
  paid: "paid",
  failed: "failed",
  canceled: "canceled",
} as const

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUS)[keyof typeof ORDER_PAYMENT_STATUS]

/** Organizer Connect payout lifecycle stored on public.orders.payout_status */
export const ORDER_PAYOUT_STATUS = {
  notRequired: "not_required",
  pending: "pending",
  blocked: "blocked",
  released: "released",
  failed: "failed",
} as const

export type OrderPayoutStatus = (typeof ORDER_PAYOUT_STATUS)[keyof typeof ORDER_PAYOUT_STATUS]

export const ORDER_REFUND_STATUS = {
  none: "none",
  pending: "pending",
  partial: "partial",
  full: "full",
} as const

export type OrderRefundStatus = (typeof ORDER_REFUND_STATUS)[keyof typeof ORDER_REFUND_STATUS]

export const ORDER_DISPUTE_STATUS = {
  none: "none",
  disputed: "disputed",
  won: "won",
  lost: "lost",
  warningClosed: "warning_closed",
} as const

export type OrderDisputeStatus = (typeof ORDER_DISPUTE_STATUS)[keyof typeof ORDER_DISPUTE_STATUS]

/** Canonical money + status columns on public.orders (integer cents). */
export type OrderPaymentFields = {
  ticket_subtotal_cents: number
  vizb_service_fee_cents: number
  processing_fee_cents: number
  buyer_total_cents: number
  organizer_payout_cents: number
  payment_status: OrderPaymentStatus
  payout_status: OrderPayoutStatus
  /** Legacy columns kept in sync by DB trigger */
  subtotal_cents: number
  platform_fee_cents: number
  total_cents: number
}

export type PaidOrderInsertInput = {
  userId: string
  eventId: string
  currency: string
  amounts: TicketCheckoutAmounts
  paymentStatus?: OrderPaymentStatus
  payoutStatus?: OrderPayoutStatus
}

export function buildPaidOrderInsertRow(input: PaidOrderInsertInput): OrderPaymentFields & {
  user_id: string
  event_id: string
  status: "pending_payment"
  currency: string
} {
  const { amounts } = input

  return {
    user_id: input.userId,
    event_id: input.eventId,
    status: "pending_payment",
    currency: input.currency,
    ticket_subtotal_cents: amounts.subtotalCents,
    vizb_service_fee_cents: amounts.platformFeeCents,
    processing_fee_cents: amounts.processingFeeCents,
    buyer_total_cents: amounts.totalCents,
    organizer_payout_cents: amounts.organizerPayoutCents,
    payment_status: input.paymentStatus ?? ORDER_PAYMENT_STATUS.created,
    payout_status: input.payoutStatus ?? ORDER_PAYOUT_STATUS.pending,
    subtotal_cents: amounts.subtotalCents,
    platform_fee_cents: amounts.platformFeeCents,
    total_cents: amounts.totalCents,
  }
}

export function assertOrderPaymentBreakdown(
  order: Pick<
    OrderPaymentFields,
    | "ticket_subtotal_cents"
    | "vizb_service_fee_cents"
    | "processing_fee_cents"
    | "buyer_total_cents"
    | "organizer_payout_cents"
  >,
): { ok: true } | { error: string } {
  const fields: Array<[string, number]> = [
    ["ticket_subtotal_cents", order.ticket_subtotal_cents],
    ["vizb_service_fee_cents", order.vizb_service_fee_cents],
    ["processing_fee_cents", order.processing_fee_cents],
    ["buyer_total_cents", order.buyer_total_cents],
    ["organizer_payout_cents", order.organizer_payout_cents],
  ]

  for (const [name, value] of fields) {
    if (!Number.isInteger(value) || value < 0) {
      return { error: `Order ${name} is invalid.` }
    }
  }

  const expectedTotal =
    order.ticket_subtotal_cents + order.vizb_service_fee_cents + order.processing_fee_cents

  if (order.buyer_total_cents !== expectedTotal) {
    return {
      error: "Order buyer_total_cents does not equal ticket subtotal plus ViZb and processing fees.",
    }
  }

  if (order.organizer_payout_cents !== order.ticket_subtotal_cents) {
    return { error: "Order organizer_payout_cents must equal ticket_subtotal_cents." }
  }

  return { ok: true }
}
