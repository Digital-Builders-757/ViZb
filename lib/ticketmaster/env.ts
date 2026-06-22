/**
 * Ticketmaster Discovery import configuration (server-only).
 */

import { parseIngestionEnabledFlag } from "@/lib/imports/source-env"
import {
  DISCOVERY_MAX_API_OFFSET,
  getDiscoveryScheduleConfig,
} from "@/lib/imports/geography/schedule-config"

export const TICKETMASTER_SOURCE = "ticketmaster" as const

export const TICKETMASTER_DISCOVERY_BASE = "https://app.ticketmaster.com/discovery/v2"

export class TicketmasterImportConfigError extends Error {
  readonly code: "disabled" | "missing_credentials" | "invalid_geography"

  constructor(code: "disabled" | "missing_credentials" | "invalid_geography", message: string) {
    super(message)
    this.name = "TicketmasterImportConfigError"
    this.code = code
  }
}

export function isTicketmasterImportEnabled(): boolean {
  return parseIngestionEnabledFlag(process.env.TICKETMASTER_IMPORT_ENABLED)
}

export function getTicketmasterApiKey(): string {
  return process.env.TICKETMASTER_API_KEY?.trim() || ""
}

function parseBoundedInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw?.trim() ? Number.parseInt(raw.trim(), 10) : fallback
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export function getTicketmasterImportLookaheadDays(): number {
  const shared = getDiscoveryScheduleConfig().lookaheadDays
  return parseBoundedInt(process.env.TICKETMASTER_IMPORT_LOOKAHEAD_DAYS, shared, 1, 365)
}

export function getTicketmasterImportPageSize(): number {
  const shared = getDiscoveryScheduleConfig().pageSize
  return parseBoundedInt(process.env.TICKETMASTER_IMPORT_PAGE_SIZE, shared, 1, 200)
}

export function getTicketmasterImportMaxPages(): number {
  const shared = getDiscoveryScheduleConfig().maxPagesPerCity
  return parseBoundedInt(process.env.TICKETMASTER_IMPORT_MAX_PAGES, shared, 1, 50)
}

export function getTicketmasterImportMaxRecords(): number {
  const shared = getDiscoveryScheduleConfig().maxRecordsPerRun
  return parseBoundedInt(process.env.TICKETMASTER_IMPORT_MAX_RECORDS, shared, 1, 5000)
}

export function isTicketmasterImportConfigured(): boolean {
  return Boolean(getTicketmasterApiKey())
}

export function assertTicketmasterLimitsValid(): void {
  const pageSize = getTicketmasterImportPageSize()
  const maxPages = getTicketmasterImportMaxPages()
  if (pageSize * maxPages >= DISCOVERY_MAX_API_OFFSET) {
    throw new TicketmasterImportConfigError(
      "invalid_geography",
      "Ticketmaster page size and max pages exceed the Discovery API offset limit.",
    )
  }
}

/** Throws when import is disabled or credentials are missing. */
export function assertTicketmasterImportConfigured(): void {
  if (!isTicketmasterImportEnabled()) {
    throw new TicketmasterImportConfigError("disabled", "Ticketmaster import is disabled.")
  }
  if (!getTicketmasterApiKey()) {
    throw new TicketmasterImportConfigError(
      "missing_credentials",
      "Ticketmaster import requires TICKETMASTER_API_KEY.",
    )
  }
  assertTicketmasterLimitsValid()
}

/** Remove API key from URLs before logging or returning errors. */
export function redactTicketmasterSecrets(text: string): string {
  return text
    .replace(/apikey=[^&\s]+/gi, "apikey=REDACTED")
    .replace(process.env.TICKETMASTER_API_KEY?.trim() || "__missing__", "REDACTED")
}
