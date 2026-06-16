import type Stripe from "stripe"

export const ORGANIZER_STRIPE_ONBOARDING_STATUS = {
  notStarted: "not_started",
  pending: "pending",
  restricted: "restricted",
  active: "active",
} as const

export type OrganizerStripeOnboardingStatus =
  (typeof ORGANIZER_STRIPE_ONBOARDING_STATUS)[keyof typeof ORGANIZER_STRIPE_ONBOARDING_STATUS]

export type OrganizerStripeCapabilitySnapshot = {
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
}

export function deriveOrganizerStripeOnboardingStatus(
  snapshot: OrganizerStripeCapabilitySnapshot,
): OrganizerStripeOnboardingStatus {
  if (snapshot.payouts_enabled && snapshot.charges_enabled && snapshot.details_submitted) {
    return ORGANIZER_STRIPE_ONBOARDING_STATUS.active
  }

  if (snapshot.details_submitted && !snapshot.charges_enabled) {
    return ORGANIZER_STRIPE_ONBOARDING_STATUS.restricted
  }

  return ORGANIZER_STRIPE_ONBOARDING_STATUS.pending
}

export function isOrganizerStripePayoutReady(
  snapshot: Pick<OrganizerStripeCapabilitySnapshot, "payouts_enabled">,
): boolean {
  return snapshot.payouts_enabled === true
}

export function organizerStripeAccountRowFromStripeAccount(
  account: Pick<
    Stripe.Account,
    "id" | "charges_enabled" | "payouts_enabled" | "details_submitted"
  >,
) {
  const snapshot: OrganizerStripeCapabilitySnapshot = {
    charges_enabled: account.charges_enabled ?? false,
    payouts_enabled: account.payouts_enabled ?? false,
    details_submitted: account.details_submitted ?? false,
  }

  return {
    stripe_account_id: account.id,
    charges_enabled: snapshot.charges_enabled,
    payouts_enabled: snapshot.payouts_enabled,
    details_submitted: snapshot.details_submitted,
    onboarding_status: deriveOrganizerStripeOnboardingStatus(snapshot),
  }
}
