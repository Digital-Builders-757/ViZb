import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

import { readMetadataOrderId } from "@/lib/stripe/webhook-idempotency"
import {
  assertOrderPaymentBreakdown,
  ORDER_DISPUTE_STATUS,
  ORDER_PAYMENT_STATUS,
  ORDER_PAYOUT_STATUS,
  type OrderDisputeStatus,
  type OrderPaymentStatus,
  type OrderPayoutStatus,
} from "@/lib/orders/order-payment-fields"
import {
  blockOrganizerPayoutForOrder,
  unblockOrganizerPayoutForOrder,
} from "@/lib/payments/create-organizer-payout-record"
import { ORGANIZER_PAYOUT_BLOCKED_REASON } from "@/lib/payments/organizer-payout-types"

export type OrderPaymentRow = {
  id: string
  event_id: string | null
  status: string
  ticket_subtotal_cents: number
  vizb_service_fee_cents: number
  processing_fee_cents: number
  buyer_total_cents: number
  organizer_payout_cents: number
  payment_status: OrderPaymentStatus
  payout_status: OrderPayoutStatus
  /** @deprecated Legacy mirror — kept in sync by DB trigger */
  subtotal_cents: number
  platform_fee_cents: number
  total_cents: number
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  refund_status: string
  dispute_status: string
  payout_blocked: boolean
  payout_blocked_reason: string | null
  payout_released_at: string | null
}

const ORDER_PAYMENT_SELECT =
  "id, event_id, status, ticket_subtotal_cents, vizb_service_fee_cents, processing_fee_cents, buyer_total_cents, organizer_payout_cents, payment_status, payout_status, subtotal_cents, platform_fee_cents, total_cents, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, refund_status, dispute_status, payout_blocked, payout_blocked_reason, payout_released_at"

function readString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  return null
}

function readPaymentIntentId(value: Stripe.PaymentIntent | string | null | undefined): string | null {
  if (typeof value === "string") return readString(value)
  return readString(value?.id)
}

function readChargeId(value: Stripe.Charge | string | null | undefined): string | null {
  if (typeof value === "string") return readString(value)
  return readString(value?.id)
}

export async function findOrderById(
  admin: SupabaseClient,
  orderId: string | null | undefined,
): Promise<OrderPaymentRow | null> {
  if (!orderId) return null
  const { data, error } = await admin.from("orders").select(ORDER_PAYMENT_SELECT).eq("id", orderId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as OrderPaymentRow | null) ?? null
}

export async function findOrderByPaymentIntentId(
  admin: SupabaseClient,
  paymentIntentId: string | null | undefined,
): Promise<OrderPaymentRow | null> {
  if (!paymentIntentId) return null
  const { data, error } = await admin
    .from("orders")
    .select(ORDER_PAYMENT_SELECT)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as OrderPaymentRow | null) ?? null
}

export async function findOrderByCheckoutSessionId(
  admin: SupabaseClient,
  sessionId: string | null | undefined,
): Promise<OrderPaymentRow | null> {
  if (!sessionId) return null
  const { data, error } = await admin
    .from("orders")
    .select(ORDER_PAYMENT_SELECT)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as OrderPaymentRow | null) ?? null
}

export async function findOrderByPaymentIntent(
  admin: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<OrderPaymentRow | null> {
  const byMetadata = await findOrderById(admin, readMetadataOrderId(paymentIntent.metadata))
  if (byMetadata) return byMetadata
  return findOrderByPaymentIntentId(admin, readString(paymentIntent.id))
}

export async function findOrderByCheckoutSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<OrderPaymentRow | null> {
  const byMetadata = await findOrderById(admin, readMetadataOrderId(session.metadata))
  if (byMetadata) return byMetadata
  return findOrderByCheckoutSessionId(admin, readString(session.id))
}

export async function findOrderByCharge(
  admin: SupabaseClient,
  charge: Stripe.Charge,
): Promise<OrderPaymentRow | null> {
  const byMetadata = await findOrderById(admin, readMetadataOrderId(charge.metadata))
  if (byMetadata) return byMetadata

  const byChargeId = readChargeId(charge.id)
  if (byChargeId) {
    const { data, error } = await admin
      .from("orders")
      .select(ORDER_PAYMENT_SELECT)
      .eq("stripe_charge_id", byChargeId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data) return data as OrderPaymentRow
  }

  const paymentIntentId = readPaymentIntentId(charge.payment_intent)
  if (paymentIntentId) {
    const byPi = await findOrderByPaymentIntentId(admin, paymentIntentId)
    if (byPi) return byPi
  }

  return null
}

export async function findOrderByRefund(
  admin: SupabaseClient,
  refund: Stripe.Refund,
): Promise<OrderPaymentRow | null> {
  const byMetadata = await findOrderById(admin, readMetadataOrderId(refund.metadata))
  if (byMetadata) return byMetadata

  const chargeId = readChargeId(refund.charge)
  if (!chargeId) return null

  const { data, error } = await admin
    .from("orders")
    .select(ORDER_PAYMENT_SELECT)
    .eq("stripe_charge_id", chargeId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (data) return data as OrderPaymentRow

  return null
}

export function assertOrderFeeFields(order: OrderPaymentRow): { ok: true } | { ok: false; error: string } {
  const breakdown = assertOrderPaymentBreakdown({
    ticket_subtotal_cents: order.ticket_subtotal_cents ?? order.subtotal_cents,
    vizb_service_fee_cents: order.vizb_service_fee_cents ?? order.platform_fee_cents,
    processing_fee_cents: order.processing_fee_cents,
    buyer_total_cents: order.buyer_total_cents ?? order.total_cents,
    organizer_payout_cents: order.organizer_payout_cents ?? order.subtotal_cents,
  })

  if ("error" in breakdown) {
    return { ok: false, error: breakdown.error }
  }

  return { ok: true }
}

export async function resolveEventSlug(admin: SupabaseClient, eventId: string | null): Promise<string | null> {
  if (!eventId) return null
  const { data, error } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle()
  if (error) throw new Error(error.message)
  return readString(data?.slug)
}

export async function patchOrderStripeReferences(
  admin: SupabaseClient,
  orderId: string,
  patch: {
    stripe_checkout_session_id?: string | null
    stripe_payment_intent_id?: string | null
    stripe_charge_id?: string | null
  },
) {
  const update: Record<string, string> = { updated_at: new Date().toISOString() }
  if (patch.stripe_checkout_session_id) update.stripe_checkout_session_id = patch.stripe_checkout_session_id
  if (patch.stripe_payment_intent_id) update.stripe_payment_intent_id = patch.stripe_payment_intent_id
  if (patch.stripe_charge_id) update.stripe_charge_id = patch.stripe_charge_id

  if (Object.keys(update).length <= 1) return

  const { error } = await admin.from("orders").update(update).eq("id", orderId)
  if (error) throw new Error(error.message)
}

export async function markOrderFailed(
  admin: SupabaseClient,
  {
    orderId,
    sessionId,
    paymentIntentId,
  }: {
    orderId?: string | null
    sessionId?: string | null
    paymentIntentId?: string | null
  },
): Promise<string | null> {
  if (!orderId && !sessionId && !paymentIntentId) return null

  let query = admin
    .from("orders")
    .update({
      status: "failed",
      payment_status: ORDER_PAYMENT_STATUS.failed,
      updated_at: new Date().toISOString(),
      ...(sessionId ? { stripe_checkout_session_id: sessionId } : {}),
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
    })
    .neq("status", "completed")

  if (orderId) {
    query = query.eq("id", orderId)
  } else if (sessionId) {
    query = query.eq("stripe_checkout_session_id", sessionId)
  } else if (paymentIntentId) {
    query = query.eq("stripe_payment_intent_id", paymentIntentId)
  }

  const { data, error } = await query.select("event_id").maybeSingle()
  if (error) throw new Error(error.message)
  return readString(data?.event_id)
}

export async function markOrderExpired(
  admin: SupabaseClient,
  {
    orderId,
    sessionId,
  }: {
    orderId?: string | null
    sessionId?: string | null
  },
): Promise<string | null> {
  if (!orderId && !sessionId) return null

  let query = admin
    .from("orders")
    .update({
      status: "expired",
      payment_status: ORDER_PAYMENT_STATUS.canceled,
      updated_at: new Date().toISOString(),
      ...(sessionId ? { stripe_checkout_session_id: sessionId } : {}),
    })
    .neq("status", "completed")

  if (orderId) {
    query = query.eq("id", orderId)
  } else {
    query = query.eq("stripe_checkout_session_id", sessionId!)
  }

  const { data, error } = await query.select("event_id").maybeSingle()
  if (error) throw new Error(error.message)
  return readString(data?.event_id)
}

export async function blockOrderPayout(
  admin: SupabaseClient,
  orderId: string,
  reason: "refund" | "dispute",
  order: Pick<OrderPaymentRow, "payout_released_at">,
) {
  if (order.payout_released_at) {
    return { blocked: false as const, reason: "payout_already_released" as const }
  }

  const { error } = await admin
    .from("orders")
    .update({
      payout_blocked: true,
      payout_blocked_reason: reason,
      payout_status: ORDER_PAYOUT_STATUS.blocked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) throw new Error(error.message)

  await blockOrganizerPayoutForOrder(admin, orderId, reason)

  return { blocked: true as const }
}

export async function applyRefundToOrder(
  admin: SupabaseClient,
  order: OrderPaymentRow,
  {
    refundStatus,
    markOrderRefunded,
  }: {
    refundStatus: "none" | "pending" | "partial" | "full"
    markOrderRefunded: boolean
  },
) {
  const payoutPatch =
    order.payout_released_at == null
      ? {
          payout_blocked: true,
          payout_blocked_reason: "refund" as const,
          payout_status: ORDER_PAYOUT_STATUS.blocked,
        }
      : {}

  const { error } = await admin
    .from("orders")
    .update({
      refund_status: refundStatus,
      ...(markOrderRefunded ? { status: "refunded" } : {}),
      ...payoutPatch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)

  if (error) throw new Error(error.message)
}

export async function voidTicketsForOrder(admin: SupabaseClient, orderId: string) {
  const { error: ticketError } = await admin
    .from("tickets")
    .update({ status: "void" })
    .eq("order_id", orderId)
    .in("status", ["active", "checked_in"])

  if (ticketError) throw new Error(ticketError.message)

  const { data: tickets, error: selectError } = await admin
    .from("tickets")
    .select("event_registration_id")
    .eq("order_id", orderId)

  if (selectError) throw new Error(selectError.message)

  const registrationIds = (tickets ?? [])
    .map((row) => readString(row.event_registration_id))
    .filter((id): id is string => Boolean(id))

  if (registrationIds.length === 0) return

  const { error: regError } = await admin
    .from("event_registrations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", registrationIds)
    .neq("status", "checked_in")

  if (regError) throw new Error(regError.message)
}

export async function applyDisputeToOrder(
  admin: SupabaseClient,
  order: OrderPaymentRow,
  disputeStatus: OrderDisputeStatus,
) {
  const payoutPatch =
    disputeStatus === ORDER_DISPUTE_STATUS.disputed || disputeStatus === ORDER_DISPUTE_STATUS.lost
      ? order.payout_released_at == null
        ? {
            payout_blocked: true,
            payout_blocked_reason: "dispute" as const,
            payout_status: ORDER_PAYOUT_STATUS.blocked,
          }
        : {}
      : disputeStatus === ORDER_DISPUTE_STATUS.won &&
          order.refund_status === "none" &&
          order.payout_released_at == null
        ? {
            payout_blocked: false,
            payout_blocked_reason: null,
            payout_status: ORDER_PAYOUT_STATUS.pending,
          }
        : {}

  const { error } = await admin
    .from("orders")
    .update({
      dispute_status: disputeStatus,
      ...payoutPatch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)

  if (error) throw new Error(error.message)

  if (
    disputeStatus === ORDER_DISPUTE_STATUS.won &&
    order.refund_status === "none" &&
    order.payout_released_at == null
  ) {
    await unblockOrganizerPayoutForOrder(admin, order.id)
  }
}

export function refundStatusFromAmounts(amountRefunded: number, chargeAmount: number): "partial" | "full" {
  if (chargeAmount <= 0) return "partial"
  return amountRefunded >= chargeAmount ? "full" : "partial"
}
