import type { SupabaseClient } from "@supabase/supabase-js"

import { ORDER_PAYOUT_STATUS } from "@/lib/orders/order-payment-fields"
import { logError } from "@/lib/log"
import {
  ORGANIZER_PAYOUT_BLOCKED_REASON,
  ORGANIZER_PAYOUT_SELECT,
  ORGANIZER_PAYOUT_STATUS,
  type OrganizerPayoutRow,
} from "@/lib/payments/organizer-payout-types"
import { findOrganizerStripeAccountByOrganizerId } from "@/lib/stripe/connect/sync-organizer-stripe-account"
import { isOrganizerStripePayoutReady } from "@/lib/stripe/connect/onboarding-status"
import { getStripe } from "@/lib/stripe/server"

type ReleaseOrderContext = {
  id: string
  status: string
  payment_status: string
  refund_status: string
  dispute_status: string
  payout_blocked: boolean
  payout_blocked_reason: string | null
  payout_released_at: string | null
  stripe_charge_id: string | null
  stripe_payment_intent_id: string | null
}

const RELEASE_ORDER_SELECT =
  "id, status, payment_status, refund_status, dispute_status, payout_blocked, payout_blocked_reason, payout_released_at, stripe_charge_id, stripe_payment_intent_id"

const RELEASE_BATCH_SIZE = 25

export type ReleaseOrganizerPayoutsResult = {
  scanned: number
  released: number
  blocked: number
  failed: number
  skipped: number
}

export type OrganizerPayoutReleaseEligibility = {
  eligible: boolean
  blockReason: string | null
}

export type ReleaseOrganizerPayoutByIdOptions = {
  /** Staff admin manual release may bypass event-end delay during MVP. */
  allowBeforeAvailableOn?: boolean
}

export function evaluateOrganizerPayoutReleaseEligibility(
  payout: OrganizerPayoutRow,
  order: ReleaseOrderContext,
  options: ReleaseOrganizerPayoutByIdOptions = {},
): OrganizerPayoutReleaseEligibility {
  if (payout.status === ORGANIZER_PAYOUT_STATUS.blocked) {
    return {
      eligible: false,
      blockReason: payout.blocked_reason ?? "blocked",
    }
  }

  if (payout.status === ORGANIZER_PAYOUT_STATUS.failed) {
    return {
      eligible: false,
      blockReason: payout.failure_reason ?? "failed",
    }
  }

  const blockReason = payoutReleaseBlockedReason(payout, order)
  if (blockReason === "not_available_yet" && options.allowBeforeAvailableOn) {
    return { eligible: true, blockReason: null }
  }

  if (blockReason === "already_released" || blockReason === "order_already_released") {
    return { eligible: false, blockReason: "already_released" }
  }

  if (blockReason === "not_available_yet") {
    return { eligible: false, blockReason: "not_available_yet" }
  }

  if (blockReason) {
    return { eligible: false, blockReason }
  }

  return { eligible: true, blockReason: null }
}

function payoutReleaseBlockedReason(
  payout: OrganizerPayoutRow,
  order: ReleaseOrderContext,
): string | null {
  if (payout.status === ORGANIZER_PAYOUT_STATUS.released || payout.stripe_transfer_id) {
    return "already_released"
  }

  if (order.payout_released_at) {
    return "order_already_released"
  }

  if (order.payout_blocked) {
    return order.payout_blocked_reason ?? ORGANIZER_PAYOUT_BLOCKED_REASON.manual
  }

  if (order.refund_status !== "none") {
    return ORGANIZER_PAYOUT_BLOCKED_REASON.refund
  }

  if (order.dispute_status === "disputed" || order.dispute_status === "lost") {
    return ORGANIZER_PAYOUT_BLOCKED_REASON.dispute
  }

  if (order.status !== "completed" || order.payment_status !== "paid") {
    return ORGANIZER_PAYOUT_BLOCKED_REASON.canceled
  }

  if (new Date(payout.available_on).getTime() > Date.now()) {
    return "not_available_yet"
  }

  if (!payout.stripe_connected_account_id) {
    return ORGANIZER_PAYOUT_BLOCKED_REASON.organizerNotReady
  }

  if (payout.organizer_payout_cents < 1) {
    return "zero_amount"
  }

  return null
}

async function markPayoutFailed(
  admin: SupabaseClient,
  payoutId: string,
  failureReason: string,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await admin
    .from("organizer_payouts")
    .update({
      status: ORGANIZER_PAYOUT_STATUS.failed,
      failure_reason: failureReason.slice(0, 500),
      updated_at: now,
    })
    .eq("id", payoutId)
    .in("status", [ORGANIZER_PAYOUT_STATUS.pending, ORGANIZER_PAYOUT_STATUS.releasing])

  if (error) throw new Error(error.message)
}

async function markPayoutBlocked(
  admin: SupabaseClient,
  payoutId: string,
  blockedReason: string,
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await admin
    .from("organizer_payouts")
    .update({
      status: ORGANIZER_PAYOUT_STATUS.blocked,
      blocked_reason: blockedReason.slice(0, 120),
      updated_at: now,
    })
    .eq("id", payoutId)
    .in("status", [ORGANIZER_PAYOUT_STATUS.pending, ORGANIZER_PAYOUT_STATUS.failed])

  if (error) throw new Error(error.message)
}

async function claimPayoutForRelease(
  admin: SupabaseClient,
  payoutId: string,
): Promise<OrganizerPayoutRow | null> {
  const now = new Date().toISOString()
  const { data, error } = await admin
    .from("organizer_payouts")
    .update({ status: ORGANIZER_PAYOUT_STATUS.releasing, updated_at: now })
    .eq("id", payoutId)
    .eq("status", ORGANIZER_PAYOUT_STATUS.pending)
    .is("stripe_transfer_id", null)
    .select(ORGANIZER_PAYOUT_SELECT)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as OrganizerPayoutRow | null) ?? null
}

async function resolveChargeIdForOrder(order: ReleaseOrderContext): Promise<string | null> {
  if (order.stripe_charge_id?.trim()) {
    return order.stripe_charge_id.trim()
  }

  if (!order.stripe_payment_intent_id?.trim()) {
    return null
  }

  const stripe = getStripe()
  const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id.trim())
  const latest = paymentIntent.latest_charge
  if (typeof latest === "string") return latest
  return latest?.id ?? null
}

async function releaseSinglePayout(
  admin: SupabaseClient,
  payout: OrganizerPayoutRow,
  options: ReleaseOrganizerPayoutByIdOptions = {},
): Promise<"released" | "blocked" | "failed" | "skipped"> {
  if (payout.stripe_transfer_id || payout.status === ORGANIZER_PAYOUT_STATUS.released) {
    return "skipped"
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(RELEASE_ORDER_SELECT)
    .eq("id", payout.order_id)
    .maybeSingle()

  if (orderError) throw new Error(orderError.message)
  if (!order) {
    await markPayoutFailed(admin, payout.id, "Order not found.")
    return "failed"
  }

  const typedOrder = order as ReleaseOrderContext
  const eligibility = evaluateOrganizerPayoutReleaseEligibility(payout, typedOrder, options)

  if (!eligibility.eligible) {
    if (
      eligibility.blockReason === "already_released" ||
      eligibility.blockReason === "order_already_released" ||
      eligibility.blockReason === "not_available_yet"
    ) {
      return "skipped"
    }

    if (eligibility.blockReason) {
      await markPayoutBlocked(admin, payout.id, eligibility.blockReason)
      return "blocked"
    }
  }

  const organizerAccount = await findOrganizerStripeAccountByOrganizerId(admin, payout.organizer_id)
  if (!organizerAccount || !isOrganizerStripePayoutReady(organizerAccount)) {
    await markPayoutBlocked(admin, payout.id, ORGANIZER_PAYOUT_BLOCKED_REASON.organizerNotReady)
    return "blocked"
  }

  const claimed = await claimPayoutForRelease(admin, payout.id)
  if (!claimed) {
    return "skipped"
  }

  let chargeId: string | null
  try {
    chargeId = await resolveChargeIdForOrder(typedOrder)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not resolve Stripe charge."
    await markPayoutFailed(admin, payout.id, message)
    logError("payout.release.charge_lookup", error, { payoutId: payout.id, orderId: payout.order_id })
    return "failed"
  }

  if (!chargeId) {
    await markPayoutFailed(admin, payout.id, "Missing Stripe charge for transfer.")
    return "failed"
  }

  const stripe = getStripe()
  const destination = claimed.stripe_connected_account_id ?? organizerAccount.stripe_account_id

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: claimed.organizer_payout_cents,
        currency: "usd",
        destination,
        source_transaction: chargeId,
        metadata: {
          payout_id: claimed.id,
          order_id: claimed.order_id,
          event_id: claimed.event_id,
          organizer_id: claimed.organizer_id,
        },
      },
      { idempotencyKey: `organizer-payout-${claimed.id}` },
    )

    const now = new Date().toISOString()
    const { error: payoutUpdateError } = await admin
      .from("organizer_payouts")
      .update({
        status: ORGANIZER_PAYOUT_STATUS.released,
        stripe_transfer_id: transfer.id,
        stripe_connected_account_id: destination,
        failure_reason: null,
        blocked_reason: null,
        updated_at: now,
      })
      .eq("id", claimed.id)

    if (payoutUpdateError) throw new Error(payoutUpdateError.message)

    const { error: orderUpdateError } = await admin
      .from("orders")
      .update({
        payout_status: ORDER_PAYOUT_STATUS.released,
        payout_released_at: now,
        updated_at: now,
      })
      .eq("id", claimed.order_id)

    if (orderUpdateError) throw new Error(orderUpdateError.message)

    return "released"
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe transfer failed."
    await markPayoutFailed(admin, payout.id, message)
    logError("payout.release.transfer", error, {
      payoutId: payout.id,
      orderId: payout.order_id,
      organizerId: payout.organizer_id,
    })
    return "failed"
  }
}

export async function releaseOrganizerPayouts(
  admin: SupabaseClient,
  { limit = RELEASE_BATCH_SIZE }: { limit?: number } = {},
): Promise<ReleaseOrganizerPayoutsResult> {
  const nowIso = new Date().toISOString()

  const { data: candidates, error } = await admin
    .from("organizer_payouts")
    .select(ORGANIZER_PAYOUT_SELECT)
    .eq("status", ORGANIZER_PAYOUT_STATUS.pending)
    .lte("available_on", nowIso)
    .is("stripe_transfer_id", null)
    .order("available_on", { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)

  const result: ReleaseOrganizerPayoutsResult = {
    scanned: candidates?.length ?? 0,
    released: 0,
    blocked: 0,
    failed: 0,
    skipped: 0,
  }

  for (const row of (candidates ?? []) as OrganizerPayoutRow[]) {
    const outcome = await releaseSinglePayout(admin, row)
    result[outcome] += 1
  }

  return result
}

export type ReleaseOrganizerPayoutByIdResult =
  | { ok: true; outcome: "released"; transferId: string }
  | { ok: false; error: string; outcome?: "blocked" | "failed" | "skipped" }

export async function releaseOrganizerPayoutById(
  admin: SupabaseClient,
  payoutId: string,
  options: ReleaseOrganizerPayoutByIdOptions = {},
): Promise<ReleaseOrganizerPayoutByIdResult> {
  const { data: payout, error } = await admin
    .from("organizer_payouts")
    .select(ORGANIZER_PAYOUT_SELECT)
    .eq("id", payoutId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!payout) {
    return { ok: false, error: "Payout not found." }
  }

  const typedPayout = payout as OrganizerPayoutRow

  const { data: order } = await admin
    .from("orders")
    .select(RELEASE_ORDER_SELECT)
    .eq("id", typedPayout.order_id)
    .maybeSingle()

  if (order) {
    const eligibility = evaluateOrganizerPayoutReleaseEligibility(
      typedPayout,
      order as ReleaseOrderContext,
      options,
    )
    if (!eligibility.eligible && eligibility.blockReason) {
      const userFacingReasons: Record<string, string> = {
        already_released: "This payout has already been released.",
        refund: "A refund exists on this order.",
        dispute: "A dispute exists on this order.",
        canceled: "The order is not in a releasable payment state.",
        manual: "A manual payout hold is active.",
        organizer_not_ready: "Organizer Stripe Connect is not payout-ready.",
        blocked: "This payout is blocked.",
        failed: "This payout previously failed and must be reviewed.",
        not_available_yet: "This payout is not yet past the release schedule.",
      }
      const message =
        userFacingReasons[eligibility.blockReason] ??
        `Payout cannot be released (${eligibility.blockReason}).`
      return { ok: false, error: message, outcome: "blocked" }
    }
  }

  const outcome = await releaseSinglePayout(admin, typedPayout, options)

  if (outcome === "released") {
    const { data: updated } = await admin
      .from("organizer_payouts")
      .select("stripe_transfer_id")
      .eq("id", payoutId)
      .maybeSingle()
    return {
      ok: true,
      outcome: "released",
      transferId: String(updated?.stripe_transfer_id ?? ""),
    }
  }

  if (outcome === "failed") {
    const { data: updated } = await admin
      .from("organizer_payouts")
      .select("failure_reason")
      .eq("id", payoutId)
      .maybeSingle()
    return {
      ok: false,
      error: String(updated?.failure_reason ?? "Stripe transfer failed."),
      outcome: "failed",
    }
  }

  return { ok: false, error: "Payout was not released.", outcome: outcome === "blocked" ? "blocked" : "skipped" }
}
