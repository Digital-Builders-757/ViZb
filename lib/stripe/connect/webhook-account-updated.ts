import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

import { syncOrganizerStripeAccountFromWebhook } from "@/lib/stripe/connect/sync-organizer-stripe-account"
import { logWebhookInfo } from "@/lib/stripe/webhook-log"

export async function handleAccountUpdated(
  admin: SupabaseClient,
  account: Stripe.Account,
): Promise<{ organizerId: string | null; skipped?: boolean }> {
  const synced = await syncOrganizerStripeAccountFromWebhook(admin, account)

  if (!synced) {
    logWebhookInfo("account.updated with no matching organizer", { stripeAccountId: account.id })
    return { organizerId: null, skipped: true }
  }

  logWebhookInfo("account.updated synced organizer Stripe account", {
    organizerId: synced.organizer_id,
    onboardingStatus: synced.onboarding_status,
    payoutsEnabled: synced.payouts_enabled,
  })

  return { organizerId: synced.organizer_id }
}
