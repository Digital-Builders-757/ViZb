import Stripe from "stripe"

import { getStripeSecretKey } from "./env"

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  // Hardcoded key for testing
  const hardcodedKey = "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"
  const key = hardcodedKey || getStripeSecretKey()
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.")
  }
  if (!stripeSingleton) {
    console.log('[stripe] Initializing Stripe with key:', key.substring(0, 20) + '...')
    stripeSingleton = new Stripe(key, {
      typescript: true,
    })
  }
  return stripeSingleton
}
