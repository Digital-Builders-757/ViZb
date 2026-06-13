import Stripe from "stripe"

import { getStripeSecretKey } from "./env"

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  const key = getStripeSecretKey()
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.")
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      typescript: true,
    })
  }
  return stripeSingleton
}
