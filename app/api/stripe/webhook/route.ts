import type Stripe from "stripe"

import { getStripeWebhookSecret } from "@/lib/stripe/env"
import { getStripe } from "@/lib/stripe/server"
import {
  claimStripeEventForProcessing,
  finalizeStripeEventProcessing,
  releaseStripeEventClaim,
} from "@/lib/stripe/webhook-idempotency"
import { logWebhookError, logWebhookInfo } from "@/lib/stripe/webhook-log"
import {
  handleStripeWebhookEvent,
  resolvePrimaryOrderIdForEvent,
  revalidatePathsForWebhook,
} from "@/lib/stripe/webhook-handlers"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export const runtime = "nodejs"

const HANDLED_EVENT_TYPES = new Set<string>([
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.expired",
  "charge.refunded",
  "refund.updated",
  "charge.dispute.created",
  "charge.dispute.closed",
  "account.updated",
])

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    logWebhookError("STRIPE_WEBHOOK_SECRET is not configured")
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
    logWebhookError("signature verification failed", {
      message: err instanceof Error ? err.message : "unknown",
    })
    return new Response("Invalid signature.", { status: 400 })
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch (err) {
    logWebhookError("service role client unavailable", {
      message: err instanceof Error ? err.message : "unknown",
    })
    return new Response("Service unavailable.", { status: 503 })
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    logWebhookInfo("ignored unhandled event type", { eventType: event.type, stripeEventId: event.id })
    return new Response("ok", { status: 200 })
  }

  let claimRecordId: string | null = null

  try {
    const primaryOrderId = await resolvePrimaryOrderIdForEvent(admin, event)
    const claim = await claimStripeEventForProcessing(admin, event, primaryOrderId)

    if (claim.alreadyProcessed) {
      logWebhookInfo("duplicate event skipped", { stripeEventId: event.id, eventType: event.type })
      return new Response("ok", { status: 200 })
    }

    claimRecordId = claim.recordId

    const result = await handleStripeWebhookEvent(admin, event)

    await finalizeStripeEventProcessing(admin, claim.recordId, {
      result: result.skipped ? "skipped" : "processed",
      orderId: result.orderId,
    })

    revalidatePathsForWebhook(result.eventSlug)

    logWebhookInfo("event processed", {
      stripeEventId: event.id,
      eventType: event.type,
      orderId: result.orderId,
      skipped: result.skipped ?? false,
    })

    return new Response("ok", { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed."

    if (claimRecordId) {
      try {
        await releaseStripeEventClaim(admin, claimRecordId)
      } catch (releaseErr) {
        logWebhookError("failed to release event claim after handler error", {
          stripeEventId: event.id,
          releaseMessage: releaseErr instanceof Error ? releaseErr.message : "unknown",
        })
      }
    }

    logWebhookError("processing failed", {
      stripeEventId: event.id,
      eventType: event.type,
      message,
    })
    return new Response("Webhook processing failed.", { status: 500 })
  }
}
