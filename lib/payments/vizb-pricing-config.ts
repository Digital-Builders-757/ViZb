/**
 * Canonical VIZB launch pricing constants (integer cents where applicable).
 * All fee/checkout logic should import from here — not duplicate magic numbers.
 */

/** VIZB service fee: 5% of ticket subtotal (decimal, not basis points). */
export const VIZB_PLATFORM_FEE_PERCENT = 0.05

/** VIZB service fee: fixed $1.00 per paid ticket, in cents. */
export const VIZB_PLATFORM_FEE_FIXED_CENTS = 100

/** Stripe card processing estimate passed through to buyer: 2.9%. */
export const STRIPE_PERCENT = 0.029

/** Stripe card processing estimate passed through to buyer: $0.30, in cents. */
export const STRIPE_FIXED_CENTS = 30

/** Minimum paid ticket face value ($5.00). Free tiers remain $0 via RSVP. */
export const MIN_PAID_TICKET_CENTS = 500

/** @deprecated Use VIZB_PLATFORM_FEE_PERCENT — retained for legacy imports. */
export const VIZB_PLATFORM_FEE_BPS = Math.round(VIZB_PLATFORM_FEE_PERCENT * 10_000)
