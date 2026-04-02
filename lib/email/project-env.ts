/**
 * Server-only email configuration. Never import from Client Components.
 */

const DEFAULT_ADMIN_INBOX = "admin@thevavibe.com"

export function getAdminInboxEmail(): string {
  const v = process.env.ADMIN_EMAIL?.trim()
  return v && v.length > 0 ? v : DEFAULT_ADMIN_INBOX
}

/** Verified sender in Resend (e.g. `VIZB <mail@yourdomain.com>`). Falls back to Resend sandbox for local dev. */
export function getResendFromAddress(): string {
  const v = process.env.RESEND_FROM?.trim()
  if (v && v.length > 0) return v
  return "VIZB Advertising <onboarding@resend.dev>"
}

export function getResendApiKey(): string | null {
  const v = process.env.RESEND_API_KEY?.trim()
  return v && v.length > 0 ? v : null
}

export function isAdvertiseEmailConfigured(): boolean {
  return getResendApiKey() !== null
}
