import { getPublicSiteOrigin } from "@/lib/public-site-url"
import {
  getStripePublishableKey,
  getStripeSecretKey,
  getStripeWebhookSecret,
} from "@/lib/stripe/env"
import { getTicketQrSecret } from "@/lib/ticket-qr-token"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import {
  MIN_PAID_TICKET_CENTS,
  VIZB_PLATFORM_FEE_FIXED_CENTS,
  VIZB_PLATFORM_FEE_PERCENT,
} from "@/lib/payments/vizb-pricing-config"

export type ReadinessCheckStatus = "pass" | "fail" | "warn"

export type ReadinessCheck = {
  key: string
  label: string
  status: ReadinessCheckStatus
  detail: string
}

function maskKeyPrefix(raw: string, visible = 8): string {
  const t = raw.trim()
  if (!t) return ""
  if (t.length <= visible) return `${t.slice(0, 2)}…`
  return `${t.slice(0, visible)}…`
}

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")
  } catch {
    return false
  }
}

function isPreviewOrProduction(): boolean {
  const vercel = process.env.VERCEL_ENV
  if (vercel === "preview" || vercel === "production") return true
  return process.env.NODE_ENV === "production"
}

export function getStripeTicketingReadinessChecks(): {
  checks: ReadinessCheck[]
  webhookUrl: string | null
  overallReady: boolean
} {
  const checks: ReadinessCheck[] = []
  const siteUrl = getPublicSiteOrigin()

  if (!siteUrl) {
    checks.push({
      key: "site_url",
      label: "NEXT_PUBLIC_SITE_URL",
      status: isPreviewOrProduction() ? "fail" : "warn",
      detail: isPreviewOrProduction()
        ? "Missing, Stripe success/cancel URLs and webhook registration need a public origin."
        : "Not set, OK for local dev; set before Preview/Production deploys.",
    })
  } else if (isLocalhostUrl(siteUrl)) {
    checks.push({
      key: "site_url",
      label: "NEXT_PUBLIC_SITE_URL",
      status: isPreviewOrProduction() ? "fail" : "warn",
      detail: isPreviewOrProduction()
        ? `Points to localhost (${siteUrl}), use your Vercel Preview or production URL.`
        : `Localhost (${siteUrl}), fine for local Stripe CLI testing.`,
    })
  } else {
    checks.push({
      key: "site_url",
      label: "NEXT_PUBLIC_SITE_URL",
      status: "pass",
      detail: siteUrl,
    })
  }

  const publishable = getStripePublishableKey()
  checks.push({
    key: "stripe_publishable",
    label: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    status: publishable ? "pass" : "fail",
    detail: publishable ? maskKeyPrefix(publishable) : "Missing, paid checkout cannot start.",
  })

  const secret = getStripeSecretKey()
  checks.push({
    key: "stripe_secret",
    label: "STRIPE_SECRET_KEY",
    status: secret ? "pass" : "fail",
    detail: secret ? `${maskKeyPrefix(secret, 7)} (server-only)` : "Missing, Checkout sessions cannot be created.",
  })

  const webhookSecret = getStripeWebhookSecret()
  checks.push({
    key: "stripe_webhook",
    label: "STRIPE_WEBHOOK_SECRET",
    status: webhookSecret ? "pass" : "fail",
    detail: webhookSecret
      ? "Configured (value hidden)"
      : "Missing, webhook fulfillment will fail; buyers may rely on return-path sync only.",
  })

  checks.push({
    key: "service_role",
    label: "SUPABASE_SERVICE_ROLE_KEY",
    status: isServiceRoleConfigured() ? "pass" : "fail",
    detail: isServiceRoleConfigured()
      ? "Configured (value hidden)"
      : "Missing, pending orders and webhook fulfillment cannot run.",
  })

  const qrSecret = getTicketQrSecret()
  checks.push({
    key: "ticket_qr",
    label: "TICKET_QR_SECRET",
    status: qrSecret ? "pass" : "warn",
    detail: qrSecret
      ? "Configured (value hidden, min 16 chars)"
      : "Missing or too short, door QR and scanner disabled.",
  })

  checks.push({
    key: "fee_percent",
    label: "VIZB platform fee percent",
    status: "pass",
    detail: `${VIZB_PLATFORM_FEE_PERCENT * 100}% of ticket subtotal (central config)`,
  })

  checks.push({
    key: "fee_fixed",
    label: "VIZB platform fee fixed",
    status: "pass",
    detail: `${VIZB_PLATFORM_FEE_FIXED_CENTS}¢ per paid ticket (central config)`,
  })

  checks.push({
    key: "min_paid_ticket",
    label: "Minimum paid ticket",
    status: "pass",
    detail: `$${(MIN_PAID_TICKET_CENTS / 100).toFixed(2)} (${MIN_PAID_TICKET_CENTS}¢)`,
  })

  const webhookUrl = siteUrl && !isLocalhostUrl(siteUrl) ? `${siteUrl}/api/stripe/webhook` : null

  const criticalKeys = [
    "site_url",
    "stripe_publishable",
    "stripe_secret",
    "stripe_webhook",
    "service_role",
    "fee_percent",
    "fee_fixed",
    "min_paid_ticket",
  ]
  const overallReady = checks
    .filter((c) => criticalKeys.includes(c.key))
    .every((c) => c.status === "pass")

  return { checks, webhookUrl, overallReady }
}
