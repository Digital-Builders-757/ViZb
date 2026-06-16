import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

import { coerceUuid } from "@/lib/coerce-uuid"
import { logError } from "@/lib/log"
import { createOrganizerPayoutRecordForOrder } from "@/lib/payments/create-organizer-payout-record"

function readString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  return null
}

export function readCheckoutSessionOrderId(session: Stripe.Checkout.Session): string | null {
  return readString(session.metadata?.order_id)
}

export function readCheckoutSessionEventId(session: Stripe.Checkout.Session): string | null {
  return readString(session.metadata?.event_id)
}

export function readCheckoutSessionUserId(session: Stripe.Checkout.Session): string | null {
  return readString(session.metadata?.user_id) ?? readString(session.client_reference_id)
}

export function readCheckoutPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  if (typeof session.payment_intent === "string") return session.payment_intent
  return readString(session.payment_intent?.id)
}

export type FulfillCheckoutSessionResult =
  | { ok: true; ticketId: string | null; eventId: string | null; eventSlug: string | null }
  | { ok: false; error: string }

export async function fulfillPaidCheckoutSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<FulfillCheckoutSessionResult> {
  if (session.payment_status !== "paid") {
    return { ok: false, error: "Payment not completed." }
  }

  const orderId = readCheckoutSessionOrderId(session)
  const eventId = readCheckoutSessionEventId(session)
  const sessionId = readString(session.id)

  if (!orderId || !sessionId) {
    return { ok: false, error: "Checkout session is missing order metadata." }
  }

  const paymentIntentId = readCheckoutPaymentIntentId(session)

  const { data: ticketId, error: fulfillError } = await admin.rpc("fulfill_stripe_ticket_order", {
    p_order_id: orderId,
    p_stripe_checkout_session_id: sessionId,
    p_stripe_payment_intent_id: paymentIntentId,
    p_amount_total_cents: session.amount_total,
    p_currency: (session.currency ?? "usd").toLowerCase(),
  })

  if (fulfillError) {
    return { ok: false, error: fulfillError.message }
  }

  let resolvedTicketId = coerceUuid(ticketId)
  if (!resolvedTicketId) {
    resolvedTicketId = await lookupTicketIdForOrder(admin, orderId)
  }

  let eventSlug: string | null = null
  if (eventId) {
    const { data: eventRow } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle()
    eventSlug = readString(eventRow?.slug)
  }

  try {
    await createOrganizerPayoutRecordForOrder(admin, orderId)
  } catch (error) {
    logError("fulfill.create_organizer_payout_record", error, { orderId, eventId })
  }

  return {
    ok: true,
    ticketId: resolvedTicketId,
    eventId,
    eventSlug,
  }
}

export async function lookupTicketIdForOrder(
  admin: SupabaseClient,
  orderId: string,
): Promise<string | null> {
  const { data: row } = await admin.from("tickets").select("id").eq("order_id", orderId).maybeSingle()
  return coerceUuid(row?.id)
}

export function revalidateAfterTicketFulfillment(eventSlug: string | null) {
  revalidatePath("/tickets")
  revalidatePath("/dashboard/tickets")
  revalidatePath("/dashboard")
  if (eventSlug) {
    revalidatePath(`/events/${eventSlug}`)
  }
}
