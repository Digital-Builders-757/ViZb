import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs"

export function shouldEnableSentry(dsn: string | undefined): dsn is string {
  return process.env.NODE_ENV === "production" && Boolean(dsn)
}

export function getSentryEnvironment(): string {
  return process.env.SENTRY_ENVIRONMENT || "production"
}

type SentryInitOptions = Pick<
  NodeOptions & BrowserOptions & EdgeOptions,
  "dsn" | "environment" | "sendDefaultPii" | "tracesSampleRate"
>

export function getBaseSentryOptions(dsn: string): SentryInitOptions {
  return {
    dsn,
    environment: getSentryEnvironment(),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  }
}
