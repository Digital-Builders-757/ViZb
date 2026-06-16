import { getSentryEnvironment, shouldEnableSentry } from "@/lib/sentry/common"

export type ReadinessCheckStatus = "pass" | "fail" | "warn"

export type ReadinessCheck = {
  key: string
  label: string
  status: ReadinessCheckStatus
  detail: string
}

function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production"
}

function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === "preview"
}

export function getSentryReadinessChecks(): {
  checks: ReadinessCheck[]
  captureEnabled: boolean
  overallReady: boolean
} {
  const checks: ReadinessCheck[] = []
  const nodeEnv = process.env.NODE_ENV ?? "unknown"
  const vercelEnv = process.env.VERCEL_ENV ?? "(not on Vercel)"
  const serverDsn = process.env.SENTRY_DSN
  const clientDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const captureEnabled =
    shouldEnableSentry(serverDsn) && shouldEnableSentry(clientDsn)

  checks.push({
    key: "node_env",
    label: "NODE_ENV",
    status: nodeEnv === "production" ? "pass" : "warn",
    detail:
      nodeEnv === "production"
        ? "Production runtime, required for Sentry capture."
        : `Current value is "${nodeEnv}". Local dev does not send Sentry events.`,
  })

  checks.push({
    key: "vercel_env",
    label: "VERCEL_ENV",
    status: isVercelPreview() ? "warn" : isVercelProduction() ? "pass" : "warn",
    detail: isVercelPreview()
      ? `Preview (${vercelEnv}), Sentry DSNs should not be configured here.`
      : isVercelProduction()
        ? "Production deployment, expected target for Sentry."
        : `Current: ${vercelEnv}. Capture only when DSNs are set and NODE_ENV is production.`,
  })

  checks.push({
    key: "server_dsn",
    label: "SENTRY_DSN",
    status: serverDsn ? (captureEnabled ? "pass" : "warn") : "fail",
    detail: serverDsn
      ? captureEnabled
        ? "Configured, server and render errors will be captured."
        : "Present but capture is gated off (non-production runtime)."
      : "Missing, server-side errors will not be sent to Sentry.",
  })

  checks.push({
    key: "client_dsn",
    label: "NEXT_PUBLIC_SENTRY_DSN",
    status: clientDsn ? (captureEnabled ? "pass" : "warn") : "fail",
    detail: clientDsn
      ? captureEnabled
        ? "Configured, client exceptions will be captured."
        : "Present but capture is gated off (non-production runtime)."
      : "Missing, client errors will not be sent to Sentry.",
  })

  checks.push({
    key: "environment",
    label: "SENTRY_ENVIRONMENT",
    status: "pass",
    detail: `Events tagged as "${getSentryEnvironment()}".`,
  })

  checks.push({
    key: "auth_token",
    label: "SENTRY_AUTH_TOKEN",
    status: process.env.SENTRY_AUTH_TOKEN ? "pass" : "warn",
    detail: process.env.SENTRY_AUTH_TOKEN
      ? "Configured, source maps upload during production builds."
      : "Not set, runtime capture may work, but stack traces may be minified without source map upload.",
  })

  const overallReady = captureEnabled && Boolean(process.env.SENTRY_AUTH_TOKEN)

  return { checks, captureEnabled, overallReady }
}
