import { revalidatePath } from "next/cache"
import type Stripe from "stripe"

import { getStripe } from "@/lib/stripe/server"
import { getStripeWebhookSecret } from "@/lib/stripe/env"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    return new Response("Stripe webhook is not configured.", { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return new Response("Missing stripe-signature header.", { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err)
    return new Response("Invalid signature.", { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (session.payment_status !== "paid") {
    return new Response("ok", { status: 200 })
  }

  const meta = session.metadata ?? {}
  const userId = meta.user_id?.trim()
  const eventId = meta.event_id?.trim()
  const ticketTypeId = meta.ticket_type_id?.trim()

  if (!userId || !eventId || !ticketTypeId || !session.id) {
    console.error("[stripe webhook] missing metadata on session", session.id)
    return new Response("ok", { status: 200 })
  }

  const amount = session.amount_total
  const currency = (session.currency ?? "usd").toLowerCase()
  if (amount == null) {
    console.error("[stripe webhook] session without amount_total", session.id)
    return new Response("Missing amount_total; retry later.", { status: 500 })
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch (err) {
    console.error("[stripe webhook] service role client unavailable", err)
    return new Response("Service unavailable.", { status: 503 })
  }

  try {
    const { error: rpcError } = await admin.rpc("fulfill_stripe_checkout_for_ticket", {
      p_stripe_checkout_session_id: session.id,
      p_user_id: userId,
      p_event_id: eventId,
      p_ticket_type_id: ticketTypeId,
      p_amount_total_cents: amount,
      p_currency: currency,
    })

    if (rpcError) {
      console.error("[stripe webhook] fulfill_stripe_checkout_for_ticket failed", rpcError.message)
      return new Response("Fulfillment failed.", { status: 500 })
    }

    const { data: evRow } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle()
    const slug = evRow?.slug
    if (slug) {
      revalidatePath(`/events/${slug}`)
    }
    revalidatePath("/tickets")
    revalidatePath("/dashboard/tickets")
  } catch (err) {
    console.error("[stripe webhook] fulfillment error", err)
    return new Response("Fulfillment error.", { status: 500 })
  }

  return new Response("ok", { status: 200 })
}
