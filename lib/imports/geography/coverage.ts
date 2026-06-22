import { buildDiscoveryDateWindow } from "@/lib/imports/geography/date-window"
import {
  HAMPTON_ROADS_LAUNCH_MARKET,
  HAMPTON_ROADS_MARKET_KEY,
} from "@/lib/imports/geography/hampton-roads"
import { getDiscoveryLimits } from "@/lib/imports/geography/limits"
import {
  getDiscoveryScheduleConfig,
  isDiscoveryGeographyValid,
} from "@/lib/imports/geography/schedule-config"
import type { DiscoveryCity, LaunchMarket, SourceCoverageSummary } from "@/lib/imports/geography/types"
import { getIngestionEnvironment } from "@/lib/imports/source-env"

export function getLaunchMarket(): LaunchMarket {
  return HAMPTON_ROADS_LAUNCH_MARKET
}

export function getEnabledDiscoveryCities(): DiscoveryCity[] {
  return [...HAMPTON_ROADS_LAUNCH_MARKET.cities]
}

export function describeActiveSourceCoverage(sourceKey: string): SourceCoverageSummary {
  const config = getDiscoveryScheduleConfig()
  const window = buildDiscoveryDateWindow()
  const limits = getDiscoveryLimits()

  return {
    sourceKey,
    marketKey: HAMPTON_ROADS_MARKET_KEY,
    marketDisplayName: HAMPTON_ROADS_LAUNCH_MARKET.displayName,
    enabledCities: getEnabledDiscoveryCities().map((city) => ({
      key: city.key,
      displayName: city.displayName,
      cityQuery: city.cityQuery,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
    })),
    dateWindow: window,
    limits,
    schedule: {
      sourceCadenceHours: config.sourceCadenceHours,
      staleThresholdDays: config.staleThresholdDays,
    },
    discoveryEnabled: config.discoveryEnabled && isDiscoveryGeographyValid(),
    environment: getIngestionEnvironment(),
  }
}
