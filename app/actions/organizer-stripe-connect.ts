"use server"

import { revalidatePath } from "next/cache"

import { requireOrgMember } from "@/lib/auth-helpers"
import { loadOrganizerStripeAccountForUser } from "@/lib/organizer/payout-readiness"
import {
  findOrganizerStripeAccountByOrganizerId,
  upsertOrganizerStripeAccountFromStripe,
} from "@/lib/stripe/connect/sync-organizer-stripe-account"
import { isStripeCheckoutConfigured } from "@/lib/stripe/env"
import { getPublicSiteOrigin } from "@/lib/public-site-url"
import { getStripe } from "@/lib/stripe/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export type OrganizerStripeConnectStatus = {
  stripeAccountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  onboardingStatus: string
  payoutReady: boolean
}

function paymentsReturnUrls(orgSlug: string): { refreshUrl: string; returnUrl: string } {
  const origin = getPublicSiteOrigin() || "http://localhost:3000"
  const base = `${origin}/organizer/${orgSlug}/payments`
  return {
    refreshUrl: `${base}?connect=refresh`,
    returnUrl: `${base}?connect=return`,
  }
}

export async function getOrganizerStripeConnectStatus(
  orgSlug: string,
): Promise<{ status: OrganizerStripeConnectStatus; error?: string }> {
  const { supabase, user } = await requireOrgMember(orgSlug)

  const row = await loadOrganizerStripeAccountForUser(supabase, user.id)

  return {
    status: {
      stripeAccountId: row?.stripe_account_id ?? null,
      chargesEnabled: row?.charges_enabled ?? false,
      payoutsEnabled: row?.payouts_enabled ?? false,
      detailsSubmitted: row?.details_submitted ?? false,
      onboardingStatus: row?.onboarding_status ?? "not_started",
      payoutReady: row?.payouts_enabled === true,
    },
  }
}

export async function createOrganizerStripeExpressAccount(
  orgSlug: string,
): Promise<{ stripeAccountId?: string; error?: string }> {
  if (!isStripeCheckoutConfigured()) {
    return { error: "Stripe is not configured in this environment yet." }
  }

  const { user } = await requireOrgMember(orgSlug)

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return { error: "Stripe Connect service is not configured on the server yet." }
  }

  const existing = await findOrganizerStripeAccountByOrganizerId(admin, user.id)
  if (existing?.stripe_account_id) {
    return { stripeAccountId: existing.stripe_account_id }
  }

  try {
    const stripe = getStripe()
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        organizer_id: user.id,
        vizb_user_id: user.id,
      },
    })

    await upsertOrganizerStripeAccountFromStripe(admin, user.id, account)
    revalidatePath(`/organizer/${orgSlug}/payments`)

    return { stripeAccountId: account.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create Stripe Connect account."
    return { error: message }
  }
}

export async function createOrganizerStripeAccountLink(
  orgSlug: string,
): Promise<{ url?: string; error?: string }> {
  if (!isStripeCheckoutConfigured()) {
    return { error: "Stripe is not configured in this environment yet." }
  }

  const { user } = await requireOrgMember(orgSlug)

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return { error: "Stripe Connect service is not configured on the server yet." }
  }

  let row = await findOrganizerStripeAccountByOrganizerId(admin, user.id)
  if (!row?.stripe_account_id) {
    const created = await createOrganizerStripeExpressAccount(orgSlug)
    if (created.error) return { error: created.error }
    row = await findOrganizerStripeAccountByOrganizerId(admin, user.id)
  }

  if (!row?.stripe_account_id) {
    return { error: "Could not resolve Stripe Connect account." }
  }

  const { refreshUrl, returnUrl } = paymentsReturnUrls(orgSlug)
  const linkType =
    row.details_submitted && row.payouts_enabled ? "account_update" : "account_onboarding"

  try {
    const stripe = getStripe()
    const accountLink = await stripe.accountLinks.create({
      account: row.stripe_account_id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: linkType,
    })

    if (!accountLink.url) {
      return { error: "Stripe did not return an onboarding link." }
    }

    return { url: accountLink.url }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Stripe onboarding."
    return { error: message }
  }
}

export async function refreshOrganizerStripeConnectStatus(
  orgSlug: string,
): Promise<{ status?: OrganizerStripeConnectStatus; error?: string }> {
  if (!isStripeCheckoutConfigured()) {
    return { error: "Stripe is not configured in this environment yet." }
  }

  const { user } = await requireOrgMember(orgSlug)

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return { error: "Stripe Connect service is not configured on the server yet." }
  }

  const row = await findOrganizerStripeAccountByOrganizerId(admin, user.id)
  if (!row?.stripe_account_id) {
    return { status: (await getOrganizerStripeConnectStatus(orgSlug)).status }
  }

  try {
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(row.stripe_account_id)
    await upsertOrganizerStripeAccountFromStripe(admin, user.id, account)
    revalidatePath(`/organizer/${orgSlug}/payments`)

    const refreshed = await getOrganizerStripeConnectStatus(orgSlug)
    return { status: refreshed.status }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh Stripe account status."
    return { error: message }
  }
}
