"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-helpers"
import { ORDER_PAYOUT_STATUS } from "@/lib/orders/order-payment-fields"
import {
  blockOrganizerPayoutForOrder,
  unblockOrganizerPayoutForOrder,
} from "@/lib/payments/create-organizer-payout-record"
import { ORGANIZER_PAYOUT_BLOCKED_REASON } from "@/lib/payments/organizer-payout-types"
import { releaseOrganizerPayoutById } from "@/lib/payments/release-organizer-payouts"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"

const uuidSchema = z.string().uuid()

function adminPaymentsPaths(orderId?: string) {
  revalidatePath("/admin/payments")
  revalidatePath("/admin/payments/payouts")
  if (orderId) {
    revalidatePath(`/admin/payments/orders/${orderId}`)
  }
}

function serviceRoleOrError(): { admin: ReturnType<typeof createServiceRoleClient> } | { error: string } {
  if (!isServiceRoleConfigured()) {
    return { error: "Service role is not configured on the server." }
  }
  try {
    return { admin: createServiceRoleClient() }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create service role client."
    return { error: message }
  }
}

export async function adminPlacePayoutHold(orderId: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  const parsed = uuidSchema.safeParse(orderId)
  if (!parsed.success) return { error: "Invalid order id." }

  const service = serviceRoleOrError()
  if ("error" in service) return { error: service.error }

  const { admin } = service
  const now = new Date().toISOString()

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, payout_released_at, ticket_subtotal_cents")
    .eq("id", parsed.data)
    .maybeSingle()

  if (orderError) return { error: orderError.message }
  if (!order) return { error: "Order not found." }
  if (order.payout_released_at) return { error: "Payout has already been released for this order." }
  if ((order.ticket_subtotal_cents ?? 0) <= 0) return { error: "Free orders do not have organizer payouts." }

  const { error: updateError } = await admin
    .from("orders")
    .update({
      payout_blocked: true,
      payout_blocked_reason: ORGANIZER_PAYOUT_BLOCKED_REASON.manual,
      payout_status: ORDER_PAYOUT_STATUS.blocked,
      updated_at: now,
    })
    .eq("id", parsed.data)

  if (updateError) return { error: updateError.message }

  await blockOrganizerPayoutForOrder(admin, parsed.data, ORGANIZER_PAYOUT_BLOCKED_REASON.manual)

  adminPaymentsPaths(parsed.data)
  return { success: true }
}

export async function adminRemovePayoutHold(orderId: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  const parsed = uuidSchema.safeParse(orderId)
  if (!parsed.success) return { error: "Invalid order id." }

  const service = serviceRoleOrError()
  if ("error" in service) return { error: service.error }

  const { admin } = service

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, payout_released_at, payout_blocked, payout_blocked_reason, refund_status, dispute_status, status, payment_status, ticket_subtotal_cents",
    )
    .eq("id", parsed.data)
    .maybeSingle()

  if (orderError) return { error: orderError.message }
  if (!order) return { error: "Order not found." }
  if (order.payout_released_at) return { error: "Payout has already been released for this order." }

  if (!order.payout_blocked) {
    return { error: "This order does not have an active payout hold." }
  }

  if (order.payout_blocked_reason !== ORGANIZER_PAYOUT_BLOCKED_REASON.manual) {
    return {
      error: `Hold was placed for "${order.payout_blocked_reason ?? "unknown"}" and cannot be cleared here.`,
    }
  }

  if (order.refund_status !== "none") {
    return { error: "Cannot remove hold while a refund is active." }
  }

  if (order.dispute_status === "disputed" || order.dispute_status === "lost") {
    return { error: "Cannot remove hold while a dispute is active." }
  }

  const now = new Date().toISOString()
  const nextPayoutStatus =
    order.status === "completed" && (order.ticket_subtotal_cents ?? 0) > 0
      ? ORDER_PAYOUT_STATUS.pending
      : ORDER_PAYOUT_STATUS.notRequired

  const { error: updateError } = await admin
    .from("orders")
    .update({
      payout_blocked: false,
      payout_blocked_reason: null,
      payout_status: nextPayoutStatus,
      updated_at: now,
    })
    .eq("id", parsed.data)

  if (updateError) return { error: updateError.message }

  await unblockOrganizerPayoutForOrder(admin, parsed.data)

  adminPaymentsPaths(parsed.data)
  return { success: true }
}

export async function adminReleaseOrganizerPayout(
  payoutId: string,
): Promise<{ success: true; transferId: string } | { error: string }> {
  await requireAdmin()

  const parsed = uuidSchema.safeParse(payoutId)
  if (!parsed.success) return { error: "Invalid payout id." }

  const service = serviceRoleOrError()
  if ("error" in service) return { error: service.error }

  const result = await releaseOrganizerPayoutById(service.admin, parsed.data, {
    allowBeforeAvailableOn: true,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  const { data: payout } = await service.admin
    .from("organizer_payouts")
    .select("order_id")
    .eq("id", parsed.data)
    .maybeSingle()

  adminPaymentsPaths(payout?.order_id ?? undefined)
  return { success: true, transferId: result.transferId }
}
