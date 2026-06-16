/**
 * Eventbrite import configuration (server-only — never import from Client Components).
 */

export const EVENTBRITE_IMPORT_STATUSES = ["pending_review", "approved", "rejected"] as const
export type EventbriteImportStatus = (typeof EVENTBRITE_IMPORT_STATUSES)[number]

export const EVENTBRITE_SOURCE = "eventbrite" as const

export class EventbriteImportConfigError extends Error {
  readonly code: "disabled" | "missing_credentials"

  constructor(code: "disabled" | "missing_credentials", message: string) {
    super(message)
    this.name = "EventbriteImportConfigError"
    this.code = code
  }
}

function parseEnabledFlag(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase()
  return v === "true" || v === "1" || v === "yes"
}

export function isEventbriteImportEnabled(): boolean {
  return parseEnabledFlag(process.env.EVENTBRITE_IMPORT_ENABLED)
}

export function getEventbritePrivateToken(): string {
  return process.env.EVENTBRITE_PRIVATE_TOKEN?.trim() || ""
}

export function getEventbriteOrganizationId(): string {
  return process.env.EVENTBRITE_ORGANIZATION_ID?.trim() || ""
}

export function getEventbriteImportLookaheadDays(): number {
  const raw = process.env.EVENTBRITE_IMPORT_LOOKAHEAD_DAYS?.trim()
  const n = raw ? Number.parseInt(raw, 10) : 90
  if (!Number.isFinite(n)) return 90
  return Math.min(365, Math.max(1, n))
}

export function getEventbriteImportDefaultStatus(): EventbriteImportStatus {
  const raw = process.env.EVENTBRITE_IMPORT_DEFAULT_STATUS?.trim() || "pending_review"
  if ((EVENTBRITE_IMPORT_STATUSES as readonly string[]).includes(raw)) {
    return raw as EventbriteImportStatus
  }
  return "pending_review"
}

export function isEventbriteImportConfigured(): boolean {
  return Boolean(getEventbritePrivateToken() && getEventbriteOrganizationId())
}

/** Throws when import is disabled or credentials are missing. */
export function assertEventbriteImportConfigured(): void {
  if (!isEventbriteImportEnabled()) {
    throw new EventbriteImportConfigError("disabled", "Eventbrite import is disabled.")
  }
  const token = getEventbritePrivateToken()
  const orgId = getEventbriteOrganizationId()
  if (!token || !orgId) {
    throw new EventbriteImportConfigError(
      "missing_credentials",
      "Eventbrite import requires EVENTBRITE_PRIVATE_TOKEN and EVENTBRITE_ORGANIZATION_ID.",
    )
  }
}
