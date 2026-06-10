import { afterEach, describe, expect, it, vi } from "vitest"

import { getStripeTicketingReadinessChecks } from "@/lib/stripe/ticketing-readiness"

const baseEnv = { ...process.env }

afterEach(() => {
  process.env = { ...baseEnv }
  vi.unstubAllEnvs()
})

describe("getStripeTicketingReadinessChecks", () => {
  it("reports overall ready when core Stripe + service role env vars are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.com")
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_abc123")
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc123")
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service_role_key")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co")
    vi.stubEnv("TICKET_QR_SECRET", "long-enough-secret-value")

    const { overallReady, webhookUrl } = getStripeTicketingReadinessChecks()
    expect(overallReady).toBe(true)
    expect(webhookUrl).toBe("https://preview.example.com/api/stripe/webhook")
  })

  it("fails site url on preview when localhost", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_abc")
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc")
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service_role_key")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co")

    const { overallReady, checks } = getStripeTicketingReadinessChecks()
    expect(overallReady).toBe(false)
    expect(checks.find((c) => c.key === "site_url")?.status).toBe("fail")
  })

  it("never prints full secret key values", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_super_secret_value")
    const { checks } = getStripeTicketingReadinessChecks()
    const secretCheck = checks.find((c) => c.key === "stripe_secret")
    expect(secretCheck?.detail).not.toContain("super_secret_value")
    expect(secretCheck?.detail).toContain("server-only")
  })
})
