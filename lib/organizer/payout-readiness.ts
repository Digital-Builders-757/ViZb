import type { SupabaseClient } from "@supabase/supabase-js"

import {
  findOrganizerStripeAccountByOrganizerId,
  type OrganizerStripeAccountRow,
} from "@/lib/stripe/connect/sync-organizer-stripe-account"
import { isOrganizerStripePayoutReady } from "@/lib/stripe/connect/onboarding-status"

export const ORGANIZER_PAYOUT_NOT_READY_MESSAGE =
  "Connect Stripe and finish payout onboarding before selling paid tickets. Free RSVP events are still available."

export async function loadOrganizerStripeAccountForUser(
  supabase: SupabaseClient,
  organizerId: string,
): Promise<OrganizerStripeAccountRow | null> {
  const { data, error } = await supabase
    .from("organizer_stripe_accounts")
    .select(
      "id, organizer_id, stripe_account_id, charges_enabled, payouts_enabled, details_submitted, onboarding_status, created_at, updated_at",
    )
    .eq("organizer_id", organizerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as OrganizerStripeAccountRow | null) ?? null
}

export async function isOrganizerPayoutReady(
  supabase: SupabaseClient,
  organizerId: string,
): Promise<boolean> {
  const row = await loadOrganizerStripeAccountForUser(supabase, organizerId)
  return row ? isOrganizerStripePayoutReady(row) : false
}

export async function assertOrganizerPayoutReady(
  supabase: SupabaseClient,
  organizerId: string | null | undefined,
): Promise<{ ok: true } | { error: string }> {
  if (!organizerId) {
    return {
      error:
        "This event does not have an organizer assigned for payouts. Connect Stripe in organizer settings first.",
    }
  }

  const ready = await isOrganizerPayoutReady(supabase, organizerId)
  if (!ready) {
    return { error: ORGANIZER_PAYOUT_NOT_READY_MESSAGE }
  }

  return { ok: true }
}

export async function assertEventOrganizerPayoutReady(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ ok: true; organizerId: string } | { error: string }> {
  const { data, error } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", eventId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data?.created_by) {
    return {
      error:
        "This event does not have an organizer assigned for payouts. Connect Stripe in organizer settings first.",
    }
  }

  const payoutCheck = await assertOrganizerPayoutReady(supabase, data.created_by)
  if ("error" in payoutCheck) return payoutCheck

  return { ok: true, organizerId: data.created_by }
}

export async function assertEventOrganizerPayoutReadyWithAdmin(
  admin: SupabaseClient,
  eventId: string,
): Promise<{ ok: true; organizerId: string } | { error: string }> {
  const { data, error } = await admin.from("events").select("created_by").eq("id", eventId).maybeSingle()

  if (error) return { error: error.message }
  if (!data?.created_by) {
    return { error: ORGANIZER_PAYOUT_NOT_READY_MESSAGE }
  }

  const row = await findOrganizerStripeAccountByOrganizerId(admin, data.created_by)
  if (!row || !isOrganizerStripePayoutReady(row)) {
    return { error: ORGANIZER_PAYOUT_NOT_READY_MESSAGE }
  }

  return { ok: true, organizerId: data.created_by }
}
