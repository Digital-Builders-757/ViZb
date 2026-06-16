import { describe, expect, it } from "vitest"

import {
  deriveOrganizerStripeOnboardingStatus,
  isOrganizerStripePayoutReady,
  organizerStripeAccountRowFromStripeAccount,
} from "@/lib/stripe/connect/onboarding-status"

describe("deriveOrganizerStripeOnboardingStatus", () => {
  it("returns active when payouts, charges, and details are ready", () => {
    expect(
      deriveOrganizerStripeOnboardingStatus({
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      }),
    ).toBe("active")
  })

  it("returns restricted when details submitted but charges disabled", () => {
    expect(
      deriveOrganizerStripeOnboardingStatus({
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: true,
      }),
    ).toBe("restricted")
  })

  it("returns pending while onboarding is incomplete", () => {
    expect(
      deriveOrganizerStripeOnboardingStatus({
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      }),
    ).toBe("pending")
  })
})

describe("isOrganizerStripePayoutReady", () => {
  it("requires payouts_enabled", () => {
    expect(isOrganizerStripePayoutReady({ payouts_enabled: true })).toBe(true)
    expect(isOrganizerStripePayoutReady({ payouts_enabled: false })).toBe(false)
  })
})

describe("organizerStripeAccountRowFromStripeAccount", () => {
  it("maps Stripe account fields to DB patch", () => {
    expect(
      organizerStripeAccountRowFromStripeAccount({
        id: "acct_123",
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      }),
    ).toEqual({
      stripe_account_id: "acct_123",
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      onboarding_status: "active",
    })
  })
})
