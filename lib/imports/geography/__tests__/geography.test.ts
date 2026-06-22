import { afterEach, describe, expect, it } from "vitest"
import {
  HAMPTON_ROADS_CITIES,
  HAMPTON_ROADS_LAUNCH_MARKET,
  LAUNCH_COUNTRY_CODE,
  LAUNCH_MARKET_TIMEZONE,
  LAUNCH_STATE_CODE,
} from "@/lib/imports/geography/hampton-roads"
import { buildDiscoveryDateWindow } from "@/lib/imports/geography/date-window"
import { isCandidateStale } from "@/lib/imports/geography/freshness"
import {
  assertPageWithinLimit,
  assertRecordWithinLimit,
  shouldStopPagination,
} from "@/lib/imports/geography/limits"
import { describeActiveSourceCoverage } from "@/lib/imports/geography/coverage"
import { getDiscoveryScheduleConfig } from "@/lib/imports/geography/schedule-config"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe("Hampton Roads launch market", () => {
  it("includes all eight cities", () => {
    expect(HAMPTON_ROADS_CITIES).toHaveLength(8)
    const keys = HAMPTON_ROADS_CITIES.map((city) => city.key)
    expect(keys).toEqual([
      "norfolk",
      "virginia_beach",
      "chesapeake",
      "portsmouth",
      "hampton",
      "newport_news",
      "suffolk",
      "williamsburg",
    ])
  })

  it("maps Virginia state and US country", () => {
    expect(HAMPTON_ROADS_LAUNCH_MARKET.stateCode).toBe(LAUNCH_STATE_CODE)
    expect(HAMPTON_ROADS_LAUNCH_MARKET.countryCode).toBe(LAUNCH_COUNTRY_CODE)
    expect(HAMPTON_ROADS_LAUNCH_MARKET.timezone).toBe(LAUNCH_MARKET_TIMEZONE)
    for (const city of HAMPTON_ROADS_CITIES) {
      expect(city.stateCode).toBe("VA")
      expect(city.countryCode).toBe("US")
    }
  })

  it("prevents duplicate city keys", () => {
    const keys = new Set(HAMPTON_ROADS_CITIES.map((city) => city.key))
    expect(keys.size).toBe(HAMPTON_ROADS_CITIES.length)
  })
})

describe("buildDiscoveryDateWindow", () => {
  it("generates UTC ISO window from Eastern civil calendar", () => {
    const now = new Date("2026-06-15T15:00:00.000Z")
    const window = buildDiscoveryDateWindow({
      now,
      lookaheadDays: 7,
      pastEventGraceDays: 1,
    })

    expect(window.rangeStartIso.endsWith("Z")).toBe(true)
    expect(window.rangeEndIso.endsWith("Z")).toBe(true)
    expect(new Date(window.rangeEndIso).getTime()).toBeGreaterThan(
      new Date(window.rangeStartIso).getTime(),
    )
    expect(window.timezone).toBe("America/New_York")
    expect(window.lookaheadDays).toBe(7)
    expect(window.pastEventGraceDays).toBe(1)
  })

  it("handles DST spring-forward with fixed clock", () => {
    const now = new Date("2026-03-08T12:00:00.000Z")
    const window = buildDiscoveryDateWindow({ now, lookaheadDays: 1, pastEventGraceDays: 0 })
    expect(new Date(window.rangeStartIso).toISOString()).toBe(window.rangeStartIso)
    expect(new Date(window.rangeEndIso).toISOString()).toBe(window.rangeEndIso)
  })

  it("respects lookahead override via env", () => {
    process.env.INGESTION_DISCOVERY_LOOKAHEAD_DAYS = "30"
    const config = getDiscoveryScheduleConfig()
    expect(config.lookaheadDays).toBe(30)
  })
})

describe("discovery limits", () => {
  it("enforces maximum page count", () => {
    process.env.INGESTION_DISCOVERY_MAX_PAGES = "3"
    const result = assertPageWithinLimit(4)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toContain("max pages")
    }
  })

  it("enforces maximum record count", () => {
    process.env.INGESTION_DISCOVERY_MAX_RECORDS = "10"
    const result = assertRecordWithinLimit(9, 2)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toContain("max records")
    }
  })

  it("stops pagination when limits reached", () => {
    process.env.INGESTION_DISCOVERY_MAX_PAGES = "2"
    process.env.INGESTION_DISCOVERY_MAX_RECORDS = "100"
    expect(
      shouldStopPagination({ pageNumber: 2, totalRecords: 10, hasMore: true }),
    ).toBe(true)
  })
})

describe("freshness helpers", () => {
  it("marks candidates stale after threshold", () => {
    process.env.INGESTION_DISCOVERY_STALE_DAYS = "7"
    const now = new Date("2026-06-15T12:00:00.000Z")
    const old = new Date("2026-06-01T12:00:00.000Z")
    expect(isCandidateStale(old, now)).toBe(true)
    expect(isCandidateStale(now, now)).toBe(false)
  })
})

describe("environment-specific discovery enablement", () => {
  it("defaults discovery off in production", () => {
    process.env.VERCEL_ENV = "production"
    delete process.env.INGESTION_DISCOVERY_ENABLED
    const config = getDiscoveryScheduleConfig()
    expect(config.discoveryEnabled).toBe(false)
  })

  it("allows discovery in preview when env flag unset", () => {
    process.env.VERCEL_ENV = "preview"
    delete process.env.INGESTION_DISCOVERY_ENABLED
    const config = getDiscoveryScheduleConfig()
    expect(config.discoveryEnabled).toBe(true)
  })

  it("respects explicit INGESTION_DISCOVERY_ENABLED=false", () => {
    process.env.VERCEL_ENV = "preview"
    process.env.INGESTION_DISCOVERY_ENABLED = "false"
    const coverage = describeActiveSourceCoverage("ticketmaster")
    expect(coverage.discoveryEnabled).toBe(false)
  })
})
