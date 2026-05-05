/**
 * Prefix for referrer lines embedded in advertise inquiry emails (`submitAdvertiseInquiry`).
 * Hidden form field values must equal the server-rendered built line starting with this prefix (see advertise action).
 */
export const ADVERTISE_SUBMISSION_CONTEXT_PREFIX = "Source — Organizer dashboard"

/** Valid slug/path segment character class for organizer + event identifiers in referrer lines. */
const SLUG_SEGMENT = /^[a-z0-9-]{1,120}$/i

/**
 * Safe attribution lines appended to advertise partnership inquiry emails from in-app CTAs.
 * Keep short and single-line; never include PII beyond what the submitter already enters in the form.
 */
export function buildAdvertiseSubmissionContext(opts: {
  from?: string | null
  orgSlug?: string | null
  eventSlug?: string | null
}): string | undefined {
  if (opts.from !== "organizer") return undefined
  const org =
    typeof opts.orgSlug === "string" && SLUG_SEGMENT.test(opts.orgSlug.trim())
      ? opts.orgSlug.trim().toLowerCase()
      : null
  const ev =
    typeof opts.eventSlug === "string" && SLUG_SEGMENT.test(opts.eventSlug.trim())
      ? opts.eventSlug.trim().toLowerCase()
      : null

  if (org && ev) {
    return `${ADVERTISE_SUBMISSION_CONTEXT_PREFIX} · org “${org}” · event “${ev}”`
  }
  if (org) {
    return `${ADVERTISE_SUBMISSION_CONTEXT_PREFIX} · org “${org}”`
  }
  if (ev) {
    return `${ADVERTISE_SUBMISSION_CONTEXT_PREFIX} · event “${ev}”`
  }
  return ADVERTISE_SUBMISSION_CONTEXT_PREFIX
}

/**
 * Server-only guard: hidden `submissionContext` must be empty or match our built pattern.
 */
export function parseSubmissionContextAttribution(raw: unknown): string | undefined {
  if (raw == null) return undefined
  if (typeof raw !== "string") return undefined
  const t = raw.trim()
  if (t.length === 0) return undefined
  if (t.length > 280) return undefined
  if (!t.startsWith(ADVERTISE_SUBMISSION_CONTEXT_PREFIX)) return undefined
  if (/[\r\n]/.test(t)) return undefined
  return t
}
