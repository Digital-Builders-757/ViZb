import { revalidatePath } from "next/cache"
import type Stripe from "stripe"

import { getStripeWebhookSecret } from "@/lib/stripe/env"
import {
  fulfillPaidCheckoutSession,
  readCheckoutSessionEventId,
  readCheckoutSessionOrderId,
  revalidateAfterTicketFulfillment,
} from "@/lib/stripe/fulfill-checkout-session"
import { getStripe } from "@/lib/stripe/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export const runtime = "nodejs"

function readString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  return null
}

async function recordWebhookEvent(admin: ReturnType<typeof createServiceRoleClient>, event: Stripe.Event) {
  const payload = JSON.parse(JSON.stringify(event))

  const { data: existing, error: existingError } = await admin
    .from("webhook_logs")
    .select("id, processed_at")
    .eq("stripe_event_id", event.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing?.processed_at) {
    return { alreadyProcessed: true, logId: existing.id as string }
  }

  if (existing?.id) {
    const { error: updateError } = await admin
      .from("webhook_logs")
      .update({ type: event.type, payload, updated_at: new Date().toISOString() })
      .eq("id", existing.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return { alreadyProcessed: false, logId: existing.id as string }
  }

  const { data: inserted, error: insertError } = await admin
    .from("webhook_logs")
    .insert({
      stripe_event_id: event.id,
      type: event.type,
      payload,
    })
    .select("id")
    .single()

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Could not record webhook event.")
  }

  return { alreadyProcessed: false, logId: inserted.id as string }
}

async function markWebhookProcessed(admin: ReturnType<typeof createServiceRoleClient>, logId: string) {
  const { error } = await admin
    .from("webhook_logs")
    .update({ processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", logId)

  if (error) {
    throw new Error(error.message)
  }
}

async function markOrderStatus(
  admin: ReturnType<typeof createServiceRoleClient>,
  {
    orderId,
    sessionId,
    paymentIntentId,
    nextStatus,
  }: {
    orderId: string | null
    sessionId?: string | null
    paymentIntentId?: string | null
    nextStatus: "failed" | "expired"
  },
): Promise<string | null> {
  if (!orderId && !sessionId && !paymentIntentId) return null

  let query = admin
    .from("orders")
    .update({
      status: nextStatus,
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
  if (error) {
    throw new Error(error.message)
  }

  return readString(data?.event_id)
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured")
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

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch (err) {
    console.error("[stripe webhook] service role client unavailable", err)
    return new Response("Service unavailable.", { status: 503 })
  }

  try {
    const recorded = await recordWebhookEvent(admin, event)
    if (recorded.alreadyProcessed) {
      return new Response("ok", { status: 200 })
    }

    let eventSlug: string | null = null

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = readCheckoutSessionOrderId(session)
        const eventId = readCheckoutSessionEventId(session)

        if (session.payment_status !== "paid") {
          console.info("[stripe webhook] checkout.session.completed skipped unpaid session", {
            sessionId: session.id,
            orderId,
            paymentStatus: session.payment_status,
          })
          break
        }

        if (!orderId || !session.id) {
          throw new Error("Missing order_id or session id on checkout.session.completed")
        }

        const fulfilled = await fulfillPaidCheckoutSession(admin, session)
        if (!fulfilled.ok) {
          console.error("[stripe webhook] fulfillment failed", {
            eventId: event.id,
            orderId,
            sessionId: session.id,
            error: fulfilled.error,
          })
          throw new Error(fulfilled.error)
        }

        eventSlug = fulfilled.eventSlug
        revalidateAfterTicketFulfillment(eventSlug)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const affectedEventId = await markOrderStatus(admin, {
          orderId: readString(paymentIntent.metadata?.order_id),
          paymentIntentId: readString(paymentIntent.id),
          nextStatus: "failed",
        })
        if (affectedEventId) {
          const { data: eventRow } = await admin.from("events").select("slug").eq("id", affectedEventId).maybeSingle()
          eventSlug = readString(eventRow?.slug)
        }
        revalidateAfterTicketFulfillment(eventSlug)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        const affectedEventId = await markOrderStatus(admin, {
          orderId: readCheckoutSessionOrderId(session),
          sessionId: readString(session.id),
          nextStatus: "expired",
        })
        if (affectedEventId) {
          const { data: eventRow } = await admin.from("events").select("slug").eq("id", affectedEventId).maybeSingle()
          eventSlug = readString(eventRow?.slug)
        }
        revalidateAfterTicketFulfillment(eventSlug)
        break
      }

      default:
        break
    }

    await markWebhookProcessed(admin, recorded.logId)

    return new Response("ok", { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed."
    console.error("[stripe webhook] processing failed", { eventId: event.id, type: event.type, message, err })
    return new Response("Webhook processing failed.", { status: 500 })
  }
}
