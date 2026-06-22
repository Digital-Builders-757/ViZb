import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import page1 from "@/lib/ticketmaster/__tests__/fixtures/events-page-1.json"
import page2 from "@/lib/ticketmaster/__tests__/fixtures/events-page-2.json"
import {
  fetchTicketmasterDiscoveryEvents,
  resetTicketmasterClientStateForTests,
} from "@/lib/ticketmaster/client"
import { redactTicketmasterSecrets } from "@/lib/ticketmaster/env"

const originalEnv = { ...process.env }

function mockFetchByCity(responses: Record<string, unknown[]>) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const cityMatch = url.match(/[?&]city=([^&]+)/)
    const city = cityMatch ? decodeURIComponent(cityMatch[1]) : "unknown"
    const pageMatch = url.match(/[?&]page=(\d+)/)
    const page = pageMatch ? Number.parseInt(pageMatch[1], 10) : 0
    const queue = responses[city] ?? [{ page: { totalPages: 0 }, _embedded: { events: [] } }]
    const body = queue[page] ?? queue[queue.length - 1]

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }))
}

beforeEach(() => {
  process.env = {
    ...originalEnv,
    TICKETMASTER_API_KEY: "test-key",
    TICKETMASTER_IMPORT_ENABLED: "true",
    INGESTION_DISCOVERY_ENABLED: "true",
    VERCEL_ENV: "preview",
    TICKETMASTER_IMPORT_PAGE_SIZE: "1",
    TICKETMASTER_IMPORT_MAX_PAGES: "2",
    TICKETMASTER_IMPORT_MAX_RECORDS: "10",
    INGESTION_DISCOVERY_MAX_PAGES: "2",
    INGESTION_DISCOVERY_MAX_RECORDS: "10",
    INGESTION_DISCOVERY_PAGE_SIZE: "1",
  }
  resetTicketmasterClientStateForTests()
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("fetchTicketmasterDiscoveryEvents", () => {
  it("fetches events for multiple Hampton Roads cities sequentially", async () => {
    mockFetchByCity({
      Norfolk: [page1, page2],
      "Virginia Beach": [{ page: { totalPages: 0 }, _embedded: { events: [] } }],
      Chesapeake: [{ page: { totalPages: 0 }, _embedded: { events: [] } }],
      Portsmouth: [{ page: { totalPages: 0 }, _embedded: { events: [] } }],
      Hampton: [{ page: { totalPages: 0 }, _embedded: { events: [] } }],
      "Newport News": [{ page: { totalPages: 0 }, _embedded: { events: [] } }],
      Suffolk: [{ page: { totalPages: 0 }, _embedded: { events: [] } }],
      Williamsburg: [{ page: { totalPages: 0 }, _embedded: { events: [] } }],
    })

    const summary = await fetchTicketmasterDiscoveryEvents({
      rangeStartIso: "2026-06-01T00:00:00.000Z",
      rangeEndIso: "2026-09-01T23:59:59.999Z",
    })

    expect(summary.totalEvents).toBeGreaterThan(0)
    expect(summary.cities.some((city) => city.cityKey === "norfolk")).toBe(true)
  })

  it("handles empty results safely", async () => {
    mockFetchByCity({})
    const summary = await fetchTicketmasterDiscoveryEvents({
      rangeStartIso: "2026-06-01T00:00:00.000Z",
      rangeEndIso: "2026-09-01T23:59:59.999Z",
    })
    expect(summary.totalEvents).toBe(0)
  })

  it("handles 429 with Retry-After", async () => {
    let attempts = 0
    vi.stubGlobal("fetch", vi.fn(async () => {
      attempts += 1
      if (attempts === 1) {
        return new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": "1" },
        })
      }
      return new Response(JSON.stringify({ page: { totalPages: 0 }, _embedded: { events: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }))

    const summary = await fetchTicketmasterDiscoveryEvents({
      rangeStartIso: "2026-06-01T00:00:00.000Z",
      rangeEndIso: "2026-09-01T23:59:59.999Z",
    })

    expect(attempts).toBeGreaterThan(1)
    expect(summary.totalEvents).toBe(0)
  })

  it("reports permanent 4xx without exposing the API key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("forbidden", { status: 403 })))

    const summary = await fetchTicketmasterDiscoveryEvents({
      rangeStartIso: "2026-06-01T00:00:00.000Z",
      rangeEndIso: "2026-09-01T23:59:59.999Z",
    })

    expect(summary.errors.length).toBeGreaterThan(0)
    expect(summary.errors.join(" ")).not.toContain("test-key")
    expect(redactTicketmasterSecrets(summary.errors.join(" "))).not.toContain("test-key")
  })

  it("handles malformed JSON safely", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{not-json", { status: 200 })))

    const summary = await fetchTicketmasterDiscoveryEvents({
      rangeStartIso: "2026-06-01T00:00:00.000Z",
      rangeEndIso: "2026-09-01T23:59:59.999Z",
    })

    expect(summary.errors.some((error) => error.includes("malformed"))).toBe(true)
  })
})
