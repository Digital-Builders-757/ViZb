import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

import { organizerStripeAccountRowFromStripeAccount } from "@/lib/stripe/connect/onboarding-status"

export type OrganizerStripeAccountRow = {
  id: string
  organizer_id: string
  stripe_account_id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  onboarding_status: string
  created_at: string
  updated_at: string
}

const ORGANIZER_STRIPE_ACCOUNT_SELECT =
  "id, organizer_id, stripe_account_id, charges_enabled, payouts_enabled, details_submitted, onboarding_status, created_at, updated_at"

function readOrganizerIdFromAccountMetadata(account: Stripe.Account): string | null {
  const fromMetadata = account.metadata?.organizer_id?.trim()
  if (fromMetadata) return fromMetadata
  const legacy = account.metadata?.vizb_user_id?.trim()
  return legacy || null
}

export async function findOrganizerStripeAccountByOrganizerId(
  admin: SupabaseClient,
  organizerId: string,
): Promise<OrganizerStripeAccountRow | null> {
  const { data, error } = await admin
    .from("organizer_stripe_accounts")
    .select(ORGANIZER_STRIPE_ACCOUNT_SELECT)
    .eq("organizer_id", organizerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as OrganizerStripeAccountRow | null) ?? null
}

export async function findOrganizerStripeAccountByStripeAccountId(
  admin: SupabaseClient,
  stripeAccountId: string,
): Promise<OrganizerStripeAccountRow | null> {
  const { data, error } = await admin
    .from("organizer_stripe_accounts")
    .select(ORGANIZER_STRIPE_ACCOUNT_SELECT)
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as OrganizerStripeAccountRow | null) ?? null
}

export async function upsertOrganizerStripeAccountFromStripe(
  admin: SupabaseClient,
  organizerId: string,
  account: Stripe.Account,
): Promise<OrganizerStripeAccountRow> {
  const patch = organizerStripeAccountRowFromStripeAccount(account)
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from("organizer_stripe_accounts")
    .upsert(
      {
        organizer_id: organizerId,
        ...patch,
        updated_at: now,
      },
      { onConflict: "organizer_id" },
    )
    .select(ORGANIZER_STRIPE_ACCOUNT_SELECT)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Could not upsert organizer Stripe account.")
  }

  return data as OrganizerStripeAccountRow
}

export async function syncOrganizerStripeAccountFromWebhook(
  admin: SupabaseClient,
  account: Stripe.Account,
): Promise<OrganizerStripeAccountRow | null> {
  const byStripeId = await findOrganizerStripeAccountByStripeAccountId(admin, account.id)
  const organizerId = byStripeId?.organizer_id ?? readOrganizerIdFromAccountMetadata(account)

  if (!organizerId) {
    return null
  }

  return upsertOrganizerStripeAccountFromStripe(admin, organizerId, account)
}
