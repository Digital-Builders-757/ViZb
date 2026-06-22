import { afterEach, describe, expect, it, vi } from "vitest"
import { ticketmasterSourceAdapter } from "@/lib/ticketmaster/adapter"
import eventSample from "@/lib/ticketmaster/__tests__/fixtures/event-sample.json"
import type { TicketmasterEvent } from "@/lib/ticketmaster/types"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe("ticketmasterSourceAdapter", () => {
  it("validateConfig reports disabled when env flag is false", async () => {
    process.env.TICKETMASTER_IMPORT_ENABLED = "false"
    const readiness = await ticketmasterSourceAdapter.validateConfig()
    expect(readiness.ready).toBe(false)
    expect(readiness.code).toBe("disabled")
  })

  it("validateConfig reports missing credentials when enabled without key", async () => {
    process.env.TICKETMASTER_IMPORT_ENABLED = "true"
    process.env.INGESTION_DISCOVERY_ENABLED = "true"
    delete process.env.TICKETMASTER_API_KEY
    const readiness = await ticketmasterSourceAdapter.validateConfig()
    expect(readiness.ready).toBe(false)
    expect(readiness.code).toBe("missing_credentials")
  })

  it("validateConfig reports invalid geography when discovery disabled in production", async () => {
    process.env.TICKETMASTER_IMPORT_ENABLED = "true"
    process.env.TICKETMASTER_API_KEY = "test-key"
    process.env.VERCEL_ENV = "production"
    delete process.env.INGESTION_DISCOVERY_ENABLED
    const readiness = await ticketmasterSourceAdapter.validateConfig()
    expect(readiness.ready).toBe(false)
    expect(readiness.code).toBe("invalid_geography")
  })

  it("normalize maps Ticketmaster raw record to NormalizedEventCandidate", () => {
    const normalized = ticketmasterSourceAdapter.normalize(eventSample as TicketmasterEvent)
    expect("error" in normalized).toBe(false)
    if ("error" in normalized) return
    expect(normalized.source_key).toBe("ticketmaster")
    expect(normalized.source_event_id).toBe("G5vYZbY1A4X9A")
    expect(normalized.source_attribution).toBe("Ticketmaster")
  })
})
