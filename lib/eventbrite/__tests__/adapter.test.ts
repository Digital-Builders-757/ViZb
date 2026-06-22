import { afterEach, describe, expect, it, vi } from "vitest"
import { eventbriteSourceAdapter } from "@/lib/eventbrite/adapter"

describe("eventbriteSourceAdapter", () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
  })

  it("validateConfig reports disabled when env flag is false", async () => {
    process.env.EVENTBRITE_IMPORT_ENABLED = "false"
    const readiness = await eventbriteSourceAdapter.validateConfig()
    expect(readiness.ready).toBe(false)
    expect(readiness.enabled).toBe(false)
    expect(readiness.code).toBe("disabled")
  })

  it("validateConfig reports missing credentials when enabled without token", async () => {
    process.env.EVENTBRITE_IMPORT_ENABLED = "true"
    delete process.env.EVENTBRITE_PRIVATE_TOKEN
    delete process.env.EVENTBRITE_ORGANIZATION_ID
    const readiness = await eventbriteSourceAdapter.validateConfig()
    expect(readiness.ready).toBe(false)
    expect(readiness.code).toBe("missing_credentials")
  })

  it("normalize maps Eventbrite raw record to NormalizedEventCandidate", () => {
    const normalized = eventbriteSourceAdapter.normalize({
      id: "999",
      name: { text: "Jazz Night" },
      description: { text: "Live music" },
      url: "https://www.eventbrite.com/e/jazz-999",
      start: { utc: "2026-08-01T23:00:00Z", timezone: "America/New_York" },
      end: { utc: "2026-08-02T02:00:00Z" },
      venue: {
        name: "Harbor Stage",
        address: { city: "Norfolk", address_1: "1 Waterside Dr" },
      },
    })

    expect("error" in normalized).toBe(false)
    if (!("error" in normalized)) {
      expect(normalized.source_key).toBe("eventbrite")
      expect(normalized.source_event_id).toBe("999")
      expect(normalized.title).toBe("Jazz Night")
      expect(normalized.city).toBe("Norfolk")
      expect(normalized.source_attribution).toBe("Eventbrite")
    }
  })
})
