/**
 * Shared types for Hampton Roads discovery geography (#268).
 * Server-only — do not import from Client Components.
 */

export type DiscoveryCityKey =
  | "norfolk"
  | "virginia_beach"
  | "chesapeake"
  | "portsmouth"
  | "hampton"
  | "newport_news"
  | "suffolk"
  | "williamsburg"

export type SourceMarketIdentifiers = {
  /** Reserved for future Ticketmaster DMA mapping (#267+). */
  dmaId?: string
  /** Reserved for geoPoint queries when supported. */
  geoPoint?: { latitude: number; longitude: number; radiusMiles?: number }
}

export type DiscoveryCity = {
  key: DiscoveryCityKey
  displayName: string
  /** Value passed to upstream city-based search APIs. */
  cityQuery: string
  stateCode: string
  countryCode: string
  timezone: string
  postalCodes?: string[]
  coordinates?: { latitude: number; longitude: number }
  sourceMarkets?: SourceMarketIdentifiers
}

export type LaunchMarket = {
  key: string
  displayName: string
  stateCode: string
  countryCode: string
  timezone: string
  cities: DiscoveryCity[]
}

export type DiscoveryScheduleConfig = {
  lookaheadDays: number
  pastEventGraceDays: number
  staleThresholdDays: number
  pageSize: number
  maxPagesPerCity: number
  maxRecordsPerRun: number
  sourceCadenceHours: number
  /** When false, discovery imports fail closed for the current environment. */
  discoveryEnabled: boolean
}

export type DiscoveryDateWindow = {
  rangeStartIso: string
  rangeEndIso: string
  timezone: string
  lookaheadDays: number
  pastEventGraceDays: number
}

export type SourceCoverageSummary = {
  sourceKey: string
  marketKey: string
  marketDisplayName: string
  enabledCities: Array<{
    key: DiscoveryCityKey
    displayName: string
    cityQuery: string
    stateCode: string
    countryCode: string
  }>
  dateWindow: DiscoveryDateWindow
  limits: {
    pageSize: number
    maxPagesPerCity: number
    maxRecordsPerRun: number
    maxApiOffset: number
  }
  schedule: {
    sourceCadenceHours: number
    staleThresholdDays: number
  }
  discoveryEnabled: boolean
  environment: string
}

export type PaginationGuardResult =
  | { allowed: true }
  | { allowed: false; reason: string }
