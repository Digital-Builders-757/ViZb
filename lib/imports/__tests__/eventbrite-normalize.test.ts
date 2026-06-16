import { describe, expect, it } from "vitest"
import {
  buildEventbritePayloadHash,
  isLikelyDuplicateEvent,
  normalizeEventbriteEvent,
} from "@/lib/imports/eventbrite-normalize"

const sampleRaw = {
  id: "123456789",
  name: { text: "Neon Night" },
  description: { text: "A great night out." },
  url: "https://www.eventbrite.com/e/neon-night-123",
  start: { timezone: "America/New_York", utc: "2026-07-01T22:00:00Z" },
  end: { timezone: "America/New_York", utc: "2026-07-02T02:00:00Z" },
  logo: { original: { url: "https://img.evbuc.com/logo.jpg" } },
  venue: {
    name: "The Venue",
    address: { city: "Norfolk", region: "VA", address_1: "100 Main St" },
  },
}

describe("normalizeEventbriteEvent", () => {
  it("maps core fields", () => {
    const result = normalizeEventbriteEvent(sampleRaw, "pending_review")
    expect("error" in result).toBe(false)
    if ("error" in result) return
    expect(result.title).toBe("Neon Night")
    expect(result.source).toBe("eventbrite")
    expect(result.source_event_id).toBe("123456789")
    expect(result.import_status).toBe("pending_review")
    expect(result.external_rsvp_url).toContain("eventbrite.com")
    expect(result.city).toBe("Norfolk")
  })

  it("stable payload hash", () => {
    const a = buildEventbritePayloadHash(sampleRaw)
    const b = buildEventbritePayloadHash(sampleRaw)
    expect(a).toBe(b)
  })
})

describe("isLikelyDuplicateEvent", () => {
  it("matches same title date city venue", () => {
    const candidate = {
      title: "Neon Night",
      starts_at: "2026-07-01T22:00:00Z",
      city: "Norfolk",
      venue_name: "The Venue",
    }
    const existing = {
      title: "neon night",
      starts_at: "2026-07-01T22:00:00Z",
      city: "norfolk",
      venue_name: "The Venue",
    }
    expect(isLikelyDuplicateEvent(candidate, existing)).toBe(true)
  })
})
