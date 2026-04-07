/**
 * Client-safe support contact. Prefer `NEXT_PUBLIC_SUPPORT_EMAIL` when set;
 * otherwise matches the server default inbox in `lib/email/project-env.ts`.
 */
export const VIZB_SUPPORT_EMAIL_FALLBACK = "admin@thevavibe.com"

export function getPublicSupportEmail(): string {
  const v = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  return v && v.length > 0 ? v : VIZB_SUPPORT_EMAIL_FALLBACK
}

export function supportMailtoHref(subject: string): string {
  const email = getPublicSupportEmail()
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`
}
