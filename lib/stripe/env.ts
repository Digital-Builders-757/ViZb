/**
 * Stripe configuration (server-side reads only except publishable key).
 */

export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() || ""
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || ""
}

export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || ""
}

/** True when checkout sessions can be created (secret + publishable for client redirect). */
export function isStripeCheckoutConfigured(): boolean {
  return Boolean(getStripeSecretKey() && getStripePublishableKey())
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(getStripeWebhookSecret() && getStripeSecretKey())
}
