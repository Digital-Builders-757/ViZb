import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

import {
  fulfillPaidCheckoutSession,
  readCheckoutSessionOrderId,
  revalidateAfterTicketFulfillment,
} from "@/lib/stripe/fulfill-checkout-session"
import { getStripe } from "@/lib/stripe/server"
import { handleAccountUpdated } from "@/lib/stripe/connect/webhook-account-updated"
import { ORDER_DISPUTE_STATUS } from "@/lib/orders/order-payment-fields"
import { logWebhookInfo } from "@/lib/stripe/webhook-log"
import {
  applyDisputeToOrder,
  applyRefundToOrder,
  assertOrderFeeFields,
  blockOrderPayout,
  findOrderByCharge,
  findOrderByCheckoutSession,
  findOrderByPaymentIntent,
  findOrderByRefund,
  markOrderExpired,
  markOrderFailed,
  patchOrderStripeReferences,
  refundStatusFromAmounts,
  resolveEventSlug,
  voidTicketsForOrder,
} from "@/lib/stripe/webhook-order-lookup"

export type WebhookHandlerResult = {
  orderId: string | null
  eventSlug: string | null
  skipped?: boolean
}

function readString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  return null
}

function readChargeIdFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): string | null {
  const latest = paymentIntent.latest_charge
  if (typeof latest === "string") return readString(latest)
  return readString(latest?.id)
}

async function fulfillOrderFromCheckoutSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<WebhookHandlerResult> {
  const orderId = readCheckoutSessionOrderId(session)

  if (session.payment_status !== "paid") {
    logWebhookInfo("checkout.session.completed skipped unpaid session", {
      sessionId: session.id,
      orderId,
      paymentStatus: session.payment_status,
    })
    return { orderId, eventSlug: null, skipped: true }
  }

  if (!orderId || !session.id) {
    throw new Error("Missing order_id or session id on checkout.session.completed")
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : readString(session.payment_intent?.id)

  await patchOrderStripeReferences(admin, orderId, {
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
  })

  const fulfilled = await fulfillPaidCheckoutSession(admin, session)
  if (!fulfilled.ok) {
    throw new Error(fulfilled.error)
  }

  return { orderId, eventSlug: fulfilled.eventSlug }
}

async function confirmPaidOrderFromPaymentIntent(
  admin: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<WebhookHandlerResult> {
  const order = await findOrderByPaymentIntent(admin, paymentIntent)
  if (!order) {
    logWebhookInfo("payment_intent.succeeded with no matching order", {
      paymentIntentId: paymentIntent.id,
    })
    return { orderId: null, eventSlug: null, skipped: true }
  }

  const feeCheck = assertOrderFeeFields(order)
  if (!feeCheck.ok) {
    throw new Error(feeCheck.error)
  }

  const chargeId = readChargeIdFromPaymentIntent(paymentIntent)
  await patchOrderStripeReferences(admin, order.id, {
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: chargeId,
  })

  if (order.status === "completed") {
    return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id), skipped: true }
  }

  if (order.status !== "pending_payment") {
    logWebhookInfo("payment_intent.succeeded ignored non-pending order", {
      orderId: order.id,
      status: order.status,
    })
    return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id), skipped: true }
  }

  const sessionId = order.stripe_checkout_session_id ?? readString(paymentIntent.metadata?.checkout_session_id)
  if (!sessionId) {
    logWebhookInfo("payment_intent.succeeded pending order missing checkout session", {
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
    })
    return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id), skipped: true }
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== "paid") {
    return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id), skipped: true }
  }

  const fulfilled = await fulfillPaidCheckoutSession(admin, session)
  if (!fulfilled.ok) {
    throw new Error(fulfilled.error)
  }

  return { orderId: order.id, eventSlug: fulfilled.eventSlug }
}

async function handleChargeRefunded(
  admin: SupabaseClient,
  charge: Stripe.Charge,
): Promise<WebhookHandlerResult> {
  const order = await findOrderByCharge(admin, charge)
  if (!order) {
    logWebhookInfo("charge.refunded with no matching order", { chargeId: charge.id })
    return { orderId: null, eventSlug: null, skipped: true }
  }

  const amountRefunded = charge.amount_refunded ?? 0
  const refundStatus = refundStatusFromAmounts(amountRefunded, charge.amount)
  const isFullRefund = refundStatus === "full"

  await patchOrderStripeReferences(admin, order.id, { stripe_charge_id: charge.id })
  await applyRefundToOrder(admin, order, {
    refundStatus,
    markOrderRefunded: isFullRefund,
  })
  await blockOrderPayout(admin, order.id, "refund", order)

  if (isFullRefund) {
    await voidTicketsForOrder(admin, order.id)
  }

  return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id) }
}

async function handleRefundUpdated(
  admin: SupabaseClient,
  refund: Stripe.Refund,
): Promise<WebhookHandlerResult> {
  const order = await findOrderByRefund(admin, refund)
  if (!order) {
    logWebhookInfo("refund.updated with no matching order", { refundId: refund.id })
    return { orderId: null, eventSlug: null, skipped: true }
  }

  const refundStatusValue = refund.status
  if (refundStatusValue === "pending") {
    await applyRefundToOrder(admin, order, { refundStatus: "pending", markOrderRefunded: false })
    await blockOrderPayout(admin, order.id, "refund", order)
    return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id) }
  }

  if (refundStatusValue === "failed" || refundStatusValue === "canceled") {
    await applyRefundToOrder(admin, order, { refundStatus: "none", markOrderRefunded: false })
    return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id) }
  }

  if (refundStatusValue !== "succeeded") {
    return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id), skipped: true }
  }

  const refundAmount = refund.amount ?? 0
  const refundStatus = refundAmount >= (order.buyer_total_cents ?? order.total_cents) ? "full" : "partial"
  const isFullRefund = refundStatus === "full"

  await applyRefundToOrder(admin, order, {
    refundStatus,
    markOrderRefunded: isFullRefund,
  })
  await blockOrderPayout(admin, order.id, "refund", order)

  if (isFullRefund) {
    await voidTicketsForOrder(admin, order.id)
  }

  return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id) }
}

function mapDisputeClosedStatus(status: Stripe.Dispute.Status): "won" | "lost" | "warning_closed" {
  if (status === "won") return "won"
  if (status === "lost") return "lost"
  return "warning_closed"
}

async function handleDisputeCreated(
  admin: SupabaseClient,
  dispute: Stripe.Dispute,
): Promise<WebhookHandlerResult> {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id
  if (!chargeId) {
    return { orderId: null, eventSlug: null, skipped: true }
  }

  const order = await findOrderByCharge(admin, {
    id: chargeId,
    object: "charge",
  } as Stripe.Charge)

  if (!order) {
    logWebhookInfo("charge.dispute.created with no matching order", { disputeId: dispute.id, chargeId })
    return { orderId: null, eventSlug: null, skipped: true }
  }

  await patchOrderStripeReferences(admin, order.id, { stripe_charge_id: chargeId })
  await applyDisputeToOrder(admin, order, ORDER_DISPUTE_STATUS.disputed)
  await blockOrderPayout(admin, order.id, "dispute", order)

  return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id) }
}

async function handleDisputeClosed(
  admin: SupabaseClient,
  dispute: Stripe.Dispute,
): Promise<WebhookHandlerResult> {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id
  if (!chargeId) {
    return { orderId: null, eventSlug: null, skipped: true }
  }

  const order = await findOrderByCharge(admin, {
    id: chargeId,
    object: "charge",
  } as Stripe.Charge)

  if (!order) {
    logWebhookInfo("charge.dispute.closed with no matching order", { disputeId: dispute.id, chargeId })
    return { orderId: null, eventSlug: null, skipped: true }
  }

  const mapped = mapDisputeClosedStatus(dispute.status)
  await applyDisputeToOrder(admin, order, mapped)

  if (mapped === "lost") {
    await blockOrderPayout(admin, order.id, "dispute", order)
  }

  return { orderId: order.id, eventSlug: await resolveEventSlug(admin, order.event_id) }
}

export async function resolvePrimaryOrderIdForEvent(
  admin: SupabaseClient,
  event: Stripe.Event,
): Promise<string | null> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const order = await findOrderByCheckoutSession(admin, session)
      return order?.id ?? readCheckoutSessionOrderId(session)
    }
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const order = await findOrderByPaymentIntent(admin, paymentIntent)
      return order?.id ?? readString(paymentIntent.metadata?.order_id)
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const order = await findOrderByCharge(admin, charge)
      return order?.id ?? null
    }
    case "refund.updated": {
      const refund = event.data.object as Stripe.Refund
      const order = await findOrderByRefund(admin, refund)
      return order?.id ?? null
    }
    case "charge.dispute.created":
    case "charge.dispute.closed": {
      const dispute = event.data.object as Stripe.Dispute
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id
      if (!chargeId) return null
      const order = await findOrderByCharge(admin, { id: chargeId, object: "charge" } as Stripe.Charge)
      return order?.id ?? null
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session
      const order = await findOrderByCheckoutSession(admin, session)
      return order?.id ?? readCheckoutSessionOrderId(session)
    }
    case "account.updated":
      return null
    default:
      return null
  }
}

export async function handleStripeWebhookEvent(
  admin: SupabaseClient,
  event: Stripe.Event,
): Promise<WebhookHandlerResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      return fulfillOrderFromCheckoutSession(admin, session)
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      if (paymentIntent.status !== "succeeded") {
        return { orderId: null, eventSlug: null, skipped: true }
      }
      return confirmPaidOrderFromPaymentIntent(admin, paymentIntent)
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const eventId = await markOrderFailed(admin, {
        orderId: readString(paymentIntent.metadata?.order_id),
        paymentIntentId: readString(paymentIntent.id),
      })
      return { orderId: readString(paymentIntent.metadata?.order_id), eventSlug: await resolveEventSlug(admin, eventId) }
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session
      const eventId = await markOrderExpired(admin, {
        orderId: readCheckoutSessionOrderId(session),
        sessionId: readString(session.id),
      })
      return {
        orderId: readCheckoutSessionOrderId(session),
        eventSlug: await resolveEventSlug(admin, eventId),
      }
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      return handleChargeRefunded(admin, charge)
    }

    case "refund.updated": {
      const refund = event.data.object as Stripe.Refund
      return handleRefundUpdated(admin, refund)
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute
      return handleDisputeCreated(admin, dispute)
    }

    case "charge.dispute.closed": {
      const dispute = event.data.object as Stripe.Dispute
      return handleDisputeClosed(admin, dispute)
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account
      const result = await handleAccountUpdated(admin, account)
      return { orderId: null, eventSlug: null, skipped: result.skipped }
    }

    default:
      return { orderId: null, eventSlug: null, skipped: true }
  }
}

export function revalidatePathsForWebhook(eventSlug: string | null) {
  revalidateAfterTicketFulfillment(eventSlug)
}
