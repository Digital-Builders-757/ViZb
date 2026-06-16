import type { SupabaseClient } from "@supabase/supabase-js"

import {
  ORDER_DISPUTE_STATUS,
  ORDER_REFUND_STATUS,
} from "@/lib/orders/order-payment-fields"
import { computeOrganizerPayoutAvailableOn } from "@/lib/payments/organizer-payout-config"
import {
  ORGANIZER_PAYOUT_BLOCKED_REASON,
  ORGANIZER_PAYOUT_SELECT,
  ORGANIZER_PAYOUT_STATUS,
  type OrganizerPayoutBlockedReason,
  type OrganizerPayoutRow,
} from "@/lib/payments/organizer-payout-types"
import { findOrganizerStripeAccountByOrganizerId } from "@/lib/stripe/connect/sync-organizer-stripe-account"

type OrderForPayoutCreate = {
  id: string
  event_id: string | null
  ticket_subtotal_cents: number
  vizb_service_fee_cents: number
  processing_fee_cents: number
  buyer_total_cents: number
  organizer_payout_cents: number
  status: string
  payment_status: string
  refund_status: string
  dispute_status: string
  payout_blocked: boolean
  payout_blocked_reason: string | null
}

const ORDER_FOR_PAYOUT_SELECT =
  "id, event_id, ticket_subtotal_cents, vizb_service_fee_cents, processing_fee_cents, buyer_total_cents, organizer_payout_cents, status, payment_status, refund_status, dispute_status, payout_blocked, payout_blocked_reason"

function readBlockedReasonFromOrder(order: OrderForPayoutCreate): OrganizerPayoutBlockedReason | null {
  if (order.payout_blocked) {
    const reason = order.payout_blocked_reason?.trim()
    if (reason === ORGANIZER_PAYOUT_BLOCKED_REASON.refund) return ORGANIZER_PAYOUT_BLOCKED_REASON.refund
    if (reason === ORGANIZER_PAYOUT_BLOCKED_REASON.dispute) return ORGANIZER_PAYOUT_BLOCKED_REASON.dispute
    if (reason === ORGANIZER_PAYOUT_BLOCKED_REASON.manual) return ORGANIZER_PAYOUT_BLOCKED_REASON.manual
    return ORGANIZER_PAYOUT_BLOCKED_REASON.manual
  }

  if (order.refund_status !== ORDER_REFUND_STATUS.none) {
    return ORGANIZER_PAYOUT_BLOCKED_REASON.refund
  }

  if (
    order.dispute_status === ORDER_DISPUTE_STATUS.disputed ||
    order.dispute_status === ORDER_DISPUTE_STATUS.lost
  ) {
    return ORGANIZER_PAYOUT_BLOCKED_REASON.dispute
  }

  if (order.status === "refunded" || order.status === "cancelled" || order.status === "expired") {
    return ORGANIZER_PAYOUT_BLOCKED_REASON.canceled
  }

  return null
}

export type CreateOrganizerPayoutRecordResult =
  | { created: true; payoutId: string }
  | { created: false; skipped: true; reason: string }
  | { created: false; existing: true; payoutId: string }

export async function createOrganizerPayoutRecordForOrder(
  admin: SupabaseClient,
  orderId: string,
): Promise<CreateOrganizerPayoutRecordResult> {
  const { data: existing, error: existingError } = await admin
    .from("organizer_payouts")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (existing?.id) {
    return { created: false, existing: true, payoutId: existing.id }
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(ORDER_FOR_PAYOUT_SELECT)
    .eq("id", orderId)
    .maybeSingle()

  if (orderError) throw new Error(orderError.message)
  if (!order) throw new Error("Order not found for payout record.")

  const typedOrder = order as OrderForPayoutCreate

  if (typedOrder.ticket_subtotal_cents <= 0 || typedOrder.organizer_payout_cents <= 0) {
    return { created: false, skipped: true, reason: "free_order" }
  }

  if (!typedOrder.event_id) {
    throw new Error("Order event is missing for payout record.")
  }

  const { data: eventRow, error: eventError } = await admin
    .from("events")
    .select("id, created_by, starts_at, ends_at")
    .eq("id", typedOrder.event_id)
    .maybeSingle()

  if (eventError) throw new Error(eventError.message)
  if (!eventRow?.created_by) {
    throw new Error("Event organizer is missing for payout record.")
  }

  const organizerId = String(eventRow.created_by)
  const stripeAccount = await findOrganizerStripeAccountByOrganizerId(admin, organizerId)
  const blockedReason = readBlockedReasonFromOrder(typedOrder)
  const availableOn = computeOrganizerPayoutAvailableOn(
    eventRow.ends_at != null ? String(eventRow.ends_at) : null,
    String(eventRow.starts_at),
  )

  const now = new Date().toISOString()
  const { data: inserted, error: insertError } = await admin
    .from("organizer_payouts")
    .insert({
      order_id: orderId,
      event_id: typedOrder.event_id,
      organizer_id: organizerId,
      stripe_connected_account_id: stripeAccount?.stripe_account_id ?? null,
      organizer_payout_cents: typedOrder.organizer_payout_cents,
      vizb_service_fee_cents: typedOrder.vizb_service_fee_cents,
      processing_fee_cents: typedOrder.processing_fee_cents,
      buyer_total_cents: typedOrder.buyer_total_cents,
      status: blockedReason ? ORGANIZER_PAYOUT_STATUS.blocked : ORGANIZER_PAYOUT_STATUS.pending,
      available_on: availableOn.toISOString(),
      blocked_reason: blockedReason,
      updated_at: now,
    })
    .select("id")
    .maybeSingle()

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced } = await admin.from("organizer_payouts").select("id").eq("order_id", orderId).maybeSingle()
      if (raced?.id) {
        return { created: false, existing: true, payoutId: raced.id }
      }
    }
    throw new Error(insertError.message)
  }

  if (!inserted?.id) {
    throw new Error("Could not create organizer payout record.")
  }

  return { created: true, payoutId: inserted.id }
}

export async function blockOrganizerPayoutForOrder(
  admin: SupabaseClient,
  orderId: string,
  reason: OrganizerPayoutBlockedReason,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await admin
    .from("organizer_payouts")
    .update({
      status: ORGANIZER_PAYOUT_STATUS.blocked,
      blocked_reason: reason,
      updated_at: now,
    })
    .eq("order_id", orderId)
    .in("status", [ORGANIZER_PAYOUT_STATUS.pending, ORGANIZER_PAYOUT_STATUS.failed])

  if (error) throw new Error(error.message)
}

export async function unblockOrganizerPayoutForOrder(admin: SupabaseClient, orderId: string): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await admin
    .from("organizer_payouts")
    .update({
      status: ORGANIZER_PAYOUT_STATUS.pending,
      blocked_reason: null,
      failure_reason: null,
      updated_at: now,
    })
    .eq("order_id", orderId)
    .eq("status", ORGANIZER_PAYOUT_STATUS.blocked)
    .is("stripe_transfer_id", null)

  if (error) throw new Error(error.message)
}

export async function findOrganizerPayoutByOrderId(
  admin: SupabaseClient,
  orderId: string,
): Promise<OrganizerPayoutRow | null> {
  const { data, error } = await admin
    .from("organizer_payouts")
    .select(ORGANIZER_PAYOUT_SELECT)
    .eq("order_id", orderId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as OrganizerPayoutRow | null) ?? null
}
