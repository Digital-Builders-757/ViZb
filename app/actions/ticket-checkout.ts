"use server"

import { z } from "zod"

import { requireAuth } from "@/lib/auth-helpers"
import { assertEventAcceptsPublicRegistration } from "@/lib/events/event-schedule"
import { assertNativeTicketingAllowed } from "@/lib/events/native-ticketing-guard"
import {
  assertStripeLineItemsMatchBuyerTotal,
  buildTicketCheckoutLineItems,
  buildTicketCheckoutMetadata,
} from "@/lib/payments/build-ticket-checkout-presentation"
import {
  calculateTicketCheckoutAmounts,
  validatePaidTicketPriceForCheckout,
} from "@/lib/payments/ticket-fees"
import { assertEventOrganizerPayoutReadyWithAdmin } from "@/lib/organizer/payout-readiness"
import {
  buildPaidOrderInsertRow,
  ORDER_PAYMENT_STATUS,
} from "@/lib/orders/order-payment-fields"
import { getPublicSiteOrigin } from "@/lib/public-site-url"
import { getStripe } from "@/lib/stripe/server"
import { isStripeCheckoutConfigured } from "@/lib/stripe/env"
import {
  fulfillPaidCheckoutSession,
  readCheckoutSessionUserId,
  revalidateAfterTicketFulfillment,
} from "@/lib/stripe/fulfill-checkout-session"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { registrationStatusFromJoin } from "@/lib/tickets/registration-status-from-row"

const checkoutParamsSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
})

function siteOriginFromEnv(): string {
  return getPublicSiteOrigin() || "http://localhost:3000"
}

function coercePositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.trunc(value)
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed)
  return null
}

export async function createTicketCheckoutSession(
  params: {
    eventId: string
    ticketTypeId: string
  },
  authenticatedUser?: { id: string; email?: string }
): Promise<{ url?: string; error?: string }> {
  if (!isStripeCheckoutConfigured()) {
    return { error: "Online checkout is not configured yet." }
  }

  const parsed = checkoutParamsSchema.safeParse(params)
  if (!parsed.success) {
    return { error: "Missing event or ticket type." }
  }

  const { eventId, ticketTypeId } = parsed.data
  
  // Use provided user or authenticate
  let user = authenticatedUser
  let supabase
  
  if (user) {
    // User was provided by API route, use service role client
    try {
      supabase = createServiceRoleClient()
    } catch (err) {
      return { error: "Checkout service is not configured on the server yet." }
    }
  } else {
    // Browser request, require full auth
    const authResult = await requireAuth()
    user = authResult.user
    supabase = authResult.supabase
  }

  const { data: tt, error: ttErr } = await supabase
    .from("ticket_types")
    .select(
      "id, event_id, name, price_cents, currency, capacity, quantity_total, quantity_sold, is_active, sales_starts_at, sales_ends_at, sales_start_at, sales_end_at",
    )
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)
    .maybeSingle()

  if (ttErr || !tt) {
    return { error: ttErr ? ttErr.message : "Ticket type not found." }
  }

  const price = typeof tt.price_cents === "number" ? tt.price_cents : Number(tt.price_cents)
  if (!Number.isFinite(price) || price < 1) {
    return { error: "This tier is free, use RSVP instead." }
  }

  const paidPriceCheck = validatePaidTicketPriceForCheckout(Math.trunc(price))
  if ("error" in paidPriceCheck) {
    return { error: paidPriceCheck.error }
  }

  const isActive = tt.is_active == null ? true : Boolean(tt.is_active)
  if (!isActive) {
    return { error: "This ticket tier is not active right now." }
  }

  const now = new Date()
  const saleStartsAt = tt.sales_start_at ?? tt.sales_starts_at
  const saleEndsAt = tt.sales_end_at ?? tt.sales_ends_at
  if (saleStartsAt && new Date(saleStartsAt) > now) {
    return { error: "This tier is not on sale yet." }
  }
  if (saleEndsAt && new Date(saleEndsAt) < now) {
    return { error: "Sales have ended for this tier." }
  }

  const { data: eventRow, error: evErr } = await supabase
    .from("events")
    .select("id, status, slug, title, rsvp_capacity, starts_at, ends_at, created_by, event_kind, source, import_status, external_rsvp_url")
    .eq("id", eventId)
    .maybeSingle()

  if (evErr || !eventRow || eventRow.status !== "published") {
    return { error: "This event is not available for purchase." }
  }

  const nativeTicketing = assertNativeTicketingAllowed(eventRow)
  if (!nativeTicketing.ok) {
    return { error: nativeTicketing.error }
  }

  const endedCheck = assertEventAcceptsPublicRegistration(
    String(eventRow.starts_at),
    eventRow.ends_at != null ? String(eventRow.ends_at) : null,
  )
  if (!endedCheck.ok) {
    return { error: endedCheck.error }
  }

  if (eventRow.rsvp_capacity != null) {
    const { data: occRaw, error: occErr } = await supabase.rpc("published_event_rsvp_occupied_count", {
      p_event_id: eventId,
    })
    if (occErr) return { error: `Could not verify capacity: ${occErr.message}` }
    const occupied = typeof occRaw === "number" ? occRaw : Number(occRaw)
    if (Number.isFinite(occupied) && occupied >= eventRow.rsvp_capacity) {
      return { error: "This event is at capacity." }
    }
  }

  const quantityTotal = coercePositiveInteger(tt.quantity_total ?? tt.capacity)
  if (quantityTotal != null) {
    const { data: soldRows, error: cntErr } = await supabase
      .from("tickets")
      .select("event_registrations!inner ( status )")
      .eq("ticket_type_id", ticketTypeId)

    if (cntErr) return { error: `Could not verify tier capacity: ${cntErr.message}` }

    const sold = (soldRows ?? []).filter((row) => {
      const st = registrationStatusFromJoin(row.event_registrations)
      return st === "confirmed" || st === "checked_in"
    }).length

    if (sold >= quantityTotal) {
      return { error: "This tier is sold out." }
    }
  }

  const { data: reg, error: regErr } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (regErr) return { error: regErr.message }

  if (reg?.status === "checked_in") {
    return { error: "You are already checked in for this event." }
  }

  if (reg?.status === "confirmed" || reg?.status === "checked_in") {
    const { count: tCount, error: tErr } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_registration_id", reg.id)

    if (tErr) return { error: tErr.message }
    if ((tCount ?? 0) > 0) {
      return { error: "You already have a ticket for this event." }
    }
  }

  const currency = (typeof tt.currency === "string" && tt.currency ? tt.currency : "usd").toLowerCase()
  if (currency !== "usd") {
    return { error: "Only USD checkout is supported right now." }
  }

  const { subtotalCents, platformFeeCents, processingFeeCents, totalCents, organizerPayoutCents } =
    calculateTicketCheckoutAmounts(price)

  const checkoutAmounts = {
    subtotalCents,
    platformFeeCents,
    processingFeeCents,
    totalCents,
    organizerPayoutCents,
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return { error: "Checkout service is not configured on the server yet." }
  }

  const payoutCheck = await assertEventOrganizerPayoutReadyWithAdmin(admin, eventId)
  if ("error" in payoutCheck) {
    return { error: payoutCheck.error }
  }

  const organizerId = payoutCheck.organizerId

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert(
      buildPaidOrderInsertRow({
        userId: user.id,
        eventId,
        currency,
        amounts: checkoutAmounts,
      }),
    )
    .select("id")
    .single()

  if (orderErr || !order) {
    return { error: orderErr?.message ?? "Could not create pending order." }
  }

  const { error: orderItemErr } = await admin.from("order_items").insert({
    order_id: order.id,
    ticket_type_id: ticketTypeId,
    quantity: 1,
    unit_price_cents: subtotalCents,
    line_total_cents: subtotalCents,
  })

  if (orderItemErr) {
    await admin
      .from("orders")
      .update({ status: "cancelled", payment_status: ORDER_PAYMENT_STATUS.canceled })
      .eq("id", order.id)
    return { error: orderItemErr.message }
  }

  const origin = siteOriginFromEnv()
  const slug = String(eventRow.slug)
  const eventTitle = String(eventRow.title)
  const ticketTierName = String(tt.name)

  const lineItems = buildTicketCheckoutLineItems({
    eventTitle,
    ticketTierName,
    currency,
    amounts: checkoutAmounts,
  })

  const lineItemCheck = assertStripeLineItemsMatchBuyerTotal(lineItems, totalCents)
  if ("error" in lineItemCheck) {
    await admin
      .from("orders")
      .update({ status: "cancelled", payment_status: ORDER_PAYMENT_STATUS.canceled })
      .eq("id", order.id)
    return { error: lineItemCheck.error }
  }

  const checkoutMetadata = buildTicketCheckoutMetadata({
    orderId: order.id,
    eventId,
    organizerId,
    ticketTypeId,
    userId: user.id,
    amounts: checkoutAmounts,
  })

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: checkoutMetadata,
      payment_intent_data: {
        metadata: checkoutMetadata,
      },
      line_items: lineItems,
      success_url: `${origin}/events/${slug}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/events/${slug}?checkout=cancelled`,
    })

    if (!session.url || !session.id) {
      await admin
        .from("orders")
        .update({ status: "cancelled", payment_status: ORDER_PAYMENT_STATUS.canceled })
        .eq("id", order.id)
      return { error: "Could not start checkout session." }
    }

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null
    const { error: updateOrderErr } = await admin
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: ORDER_PAYMENT_STATUS.checkoutStarted,
        ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
      })
      .eq("id", order.id)

    if (updateOrderErr) {
      await admin
        .from("orders")
        .update({ status: "cancelled", payment_status: ORDER_PAYMENT_STATUS.canceled })
        .eq("id", order.id)
      return { error: updateOrderErr.message }
    }

    return { url: session.url }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout session."
    console.error("[ticket-checkout] Stripe error:", message, error)
    await admin
      .from("orders")
      .update({ status: "cancelled", payment_status: ORDER_PAYMENT_STATUS.canceled })
      .eq("id", order.id)
    return { error: message }
  }
}

const checkoutSessionIdSchema = z.string().min(8)

/**
 * Idempotent fallback when Stripe webhooks are delayed or misconfigured (common on Vercel Preview).
 * Retrieves the paid Checkout Session and runs the same fulfillment RPC as the webhook.
 */
export async function syncPaidTicketCheckoutSession(
  sessionId: string,
): Promise<{ ticketId?: string; error?: string }> {
  if (!isStripeCheckoutConfigured()) {
    return { error: "Online checkout is not configured yet." }
  }

  const parsed = checkoutSessionIdSchema.safeParse(sessionId.trim())
  if (!parsed.success) {
    return { error: "Invalid checkout session." }
  }

  const { user } = await requireAuth()

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return { error: "Checkout service is not configured on the server yet." }
  }

  let session
  try {
    const stripe = getStripe()
    session = await stripe.checkout.sessions.retrieve(parsed.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify checkout session."
    return { error: message }
  }

  const sessionUserId = readCheckoutSessionUserId(session)
  if (!sessionUserId || sessionUserId !== user.id) {
    return { error: "This checkout session does not belong to your account." }
  }

  const fulfilled = await fulfillPaidCheckoutSession(admin, session)
  if (!fulfilled.ok) {
    return { error: fulfilled.error }
  }

  revalidateAfterTicketFulfillment(fulfilled.eventSlug)

  return { ticketId: fulfilled.ticketId ?? undefined }
}
