import { getIngestionEnvironment } from "@/lib/imports/source-env"
import type { DiscoveryScheduleConfig } from "@/lib/imports/geography/types"

const DEFAULTS = {
  lookaheadDays: 90,
  pastEventGraceDays: 1,
  staleThresholdDays: 14,
  pageSize: 20,
  maxPagesPerCity: 5,
  maxRecordsPerRun: 500,
  sourceCadenceHours: 6,
} as const

/** Ticketmaster Discovery API: size × page must stay below 1,000. */
export const DISCOVERY_MAX_API_OFFSET = 1000

function parseBoundedInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw?.trim() ? Number.parseInt(raw.trim(), 10) : fallback
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function parseDiscoveryEnabledFlag(): boolean {
  const raw = process.env.INGESTION_DISCOVERY_ENABLED?.trim().toLowerCase()
  if (raw === "true" || raw === "1" || raw === "yes") return true
  if (raw === "false" || raw === "0" || raw === "no") return false

  const env = getIngestionEnvironment()
  if (env === "production") return false
  return true
}

export function getDiscoveryScheduleConfig(): DiscoveryScheduleConfig {
  const pageSize = parseBoundedInt(process.env.INGESTION_DISCOVERY_PAGE_SIZE, DEFAULTS.pageSize, 1, 200)
  const maxPagesPerCity = parseBoundedInt(
    process.env.INGESTION_DISCOVERY_MAX_PAGES,
    DEFAULTS.maxPagesPerCity,
    1,
    50,
  )

  return {
    lookaheadDays: parseBoundedInt(
      process.env.INGESTION_DISCOVERY_LOOKAHEAD_DAYS,
      DEFAULTS.lookaheadDays,
      1,
      365,
    ),
    pastEventGraceDays: parseBoundedInt(
      process.env.INGESTION_DISCOVERY_PAST_GRACE_DAYS,
      DEFAULTS.pastEventGraceDays,
      0,
      30,
    ),
    staleThresholdDays: parseBoundedInt(
      process.env.INGESTION_DISCOVERY_STALE_DAYS,
      DEFAULTS.staleThresholdDays,
      1,
      90,
    ),
    pageSize,
    maxPagesPerCity,
    maxRecordsPerRun: parseBoundedInt(
      process.env.INGESTION_DISCOVERY_MAX_RECORDS,
      DEFAULTS.maxRecordsPerRun,
      1,
      5000,
    ),
    sourceCadenceHours: DEFAULTS.sourceCadenceHours,
    discoveryEnabled: parseDiscoveryEnabledFlag(),
  }
}

export function isDiscoveryGeographyValid(): boolean {
  const config = getDiscoveryScheduleConfig()
  if (config.pageSize * config.maxPagesPerCity >= DISCOVERY_MAX_API_OFFSET) return false
  return true
}
