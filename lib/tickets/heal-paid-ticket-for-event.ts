import type { SupabaseClient } from "@supabase/supabase-js"

import { coerceUuid } from "@/lib/coerce-uuid"
import { fulfillPaidCheckoutSession } from "@/lib/stripe/fulfill-checkout-session"
import { isStripeCheckoutConfigured } from "@/lib/stripe/env"
import { getStripe } from "@/lib/stripe/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

type HealResult = { ticketId: string } | { error: string } | null

/**
 * Self-heals paid orders that completed in Stripe but never minted a ticket row
 * (webhook delay/misconfig on Preview). Mirrors free RSVP heal on `/events/[slug]`.
 */
export async function healPaidTicketForEvent(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
): Promise<HealResult> {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, total_cents, stripe_checkout_session_id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .gt("total_cents", 0)
    .in("status", ["completed", "pending_payment"])
    .order("created_at", { ascending: false })
    .limit(5)

  if (ordersError) {
    return { error: ordersError.message }
  }

  if (!orders?.length) {
    return null
  }

  for (const order of orders) {
    const orderId = coerceUuid(order.id)
    if (!orderId) continue

    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle()

    const existingId = coerceUuid(existingTicket?.id)
    if (existingId) {
      return { ticketId: existingId }
    }

    const sessionId = typeof order.stripe_checkout_session_id === "string"
      ? order.stripe_checkout_session_id.trim()
      : ""
    if (!sessionId || !isStripeCheckoutConfigured()) {
      continue
    }

    try {
      const admin = createServiceRoleClient()
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status !== "paid") {
        continue
      }

      const fulfilled = await fulfillPaidCheckoutSession(admin, session)
      if (!fulfilled.ok) {
        continue
      }

      if (fulfilled.ticketId) {
        return { ticketId: fulfilled.ticketId }
      }

      const { data: ticketAfter } = await admin
        .from("tickets")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle()

      const healedId = coerceUuid(ticketAfter?.id)
      if (healedId) {
        return { ticketId: healedId }
      }
    } catch {
      continue
    }
  }

  return null
}
