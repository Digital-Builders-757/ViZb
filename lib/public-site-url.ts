/**
 * Canonical public origin for absolute links (Stripe, calendar attachments, shared lineup URLs).
 * Set **`NEXT_PUBLIC_SITE_URL`** per environment (no trailing slash required).
 * Production should match the hostname users land on after redirects (e.g. `https://www.vizbva.com`).
 */

export function normalizePublicSiteUrl(raw?: string | null): string {
  return (raw ?? "").trim().replace(/\/$/, "")
}

export function getPublicSiteOrigin(): string {
  return normalizePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
}

/** Path only; safe for same-origin links. */
export function getPublicLineupPath(eventSlug: string): string {
  return `/lineup/${encodeURIComponent(eventSlug)}`
}

/** `https://…/lineup/…` when **`NEXT_PUBLIC_SITE_URL`** is set; otherwise `null`. */
export function getPublicLineupAbsoluteUrl(eventSlug: string): string | null {
  const base = getPublicSiteOrigin()
  if (!base) return null
  return `${base}${getPublicLineupPath(eventSlug)}`
}

/**
 * Prefer absolute URL for copy/embed; fall back to path if the site URL env is missing (local dev).
 */
export function getPublicLineupShareTarget(eventSlug: string): string {
  return getPublicLineupAbsoluteUrl(eventSlug) ?? getPublicLineupPath(eventSlug)
}
