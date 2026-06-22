/**
 * Shared env helpers for ingestion source feature flags (server-only).
 */

export function parseIngestionEnabledFlag(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase()
  return v === "true" || v === "1" || v === "yes"
}

export function getIngestionEnvironment(): string {
  const override = process.env.INGESTION_ENVIRONMENT?.trim()
  if (override) return override
  const vercel = process.env.VERCEL_ENV?.trim()
  if (vercel) return vercel
  return process.env.NODE_ENV?.trim() || "development"
}
