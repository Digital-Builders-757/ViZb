import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

export type ProcessedStripeEventResult = "processed" | "skipped" | "failed"

export type ClaimStripeEventResult =
  | { alreadyProcessed: true; stripeEventId: string }
  | { alreadyProcessed: false; recordId: string }

function readString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  return null
}

/**
 * Claim a Stripe event for processing. Returns alreadyProcessed when stripe_event_id exists.
 */
export async function claimStripeEventForProcessing(
  admin: SupabaseClient,
  event: Stripe.Event,
  orderId?: string | null,
): Promise<ClaimStripeEventResult> {
  const { data: existing, error: existingError } = await admin
    .from("processed_stripe_events")
    .select("id, result")
    .eq("stripe_event_id", event.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing?.id) {
    if (existing.result === "processed" || existing.result === "skipped") {
      return { alreadyProcessed: true, stripeEventId: event.id }
    }

    const { error: resetError } = await admin
      .from("processed_stripe_events")
      .update({
        event_type: event.type,
        order_id: orderId ?? null,
        result: "processed",
        error_message: null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (resetError) {
      throw new Error(resetError.message)
    }

    return { alreadyProcessed: false, recordId: existing.id as string }
  }

  const { data: inserted, error: insertError } = await admin
    .from("processed_stripe_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      order_id: orderId ?? null,
      result: "processed",
    })
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return { alreadyProcessed: true, stripeEventId: event.id }
    }
    throw new Error(insertError.message ?? "Could not claim Stripe event.")
  }

  if (!inserted?.id) {
    throw new Error("Could not claim Stripe event.")
  }

  return { alreadyProcessed: false, recordId: inserted.id as string }
}

export async function finalizeStripeEventProcessing(
  admin: SupabaseClient,
  recordId: string,
  {
    result = "processed",
    orderId,
    errorMessage,
  }: {
    result?: ProcessedStripeEventResult
    orderId?: string | null
    errorMessage?: string | null
  } = {},
) {
  const { error } = await admin
    .from("processed_stripe_events")
    .update({
      result,
      order_id: orderId ?? undefined,
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", recordId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function releaseStripeEventClaim(admin: SupabaseClient, recordId: string) {
  const { error } = await admin.from("processed_stripe_events").delete().eq("id", recordId)
  if (error) {
    throw new Error(error.message)
  }
}

export function readMetadataOrderId(metadata: Stripe.Metadata | null | undefined): string | null {
  return readString(metadata?.order_id)
}
