import { describe, expect, it } from "vitest"
import eventSample from "@/lib/ticketmaster/__tests__/fixtures/event-sample.json"
import {
  normalizeTicketmasterEvent,
  pickTicketmasterImageUrl,
} from "@/lib/ticketmaster/normalize"
import type { TicketmasterEvent, TicketmasterImage } from "@/lib/ticketmaster/types"

describe("pickTicketmasterImageUrl", () => {
  it("prefers the widest 16_9 image", () => {
    const images: TicketmasterImage[] = [
      { ratio: "16_9", url: "https://images.example.com/small.jpg", width: 800 },
      { ratio: "16_9", url: "https://images.example.com/large.jpg", width: 1920 },
      { ratio: "4_3", url: "https://images.example.com/fallback.jpg", width: 3000 },
    ]
    expect(pickTicketmasterImageUrl(images)).toBe("https://images.example.com/large.jpg")
  })
})

describe("normalizeTicketmasterEvent", () => {
  it("maps Ticketmaster event into NormalizedEventCandidate", () => {
    const normalized = normalizeTicketmasterEvent(eventSample as TicketmasterEvent)
    expect("error" in normalized).toBe(false)
    if ("error" in normalized) return

    expect(normalized.source_key).toBe("ticketmaster")
    expect(normalized.source_event_id).toBe("G5vYZbY1A4X9A")
    expect(normalized.title).toBe("Norfolk Jazz Festival")
    expect(normalized.city).toBe("Norfolk")
    expect(normalized.region).toBe("VA")
    expect(normalized.source_attribution).toBe("Ticketmaster")
    expect(normalized.image_url).toBe("https://images.example.com/jazz-16x9.jpg")
    expect(normalized.external_ticket_url).toBe("https://www.ticketmaster.com/event/G5vYZbY1A4X9A")
    expect(normalized.categories).toContain("Jazz")
    expect(normalized.source_status).toBe("onsale")
  })

  it("does not invent missing description", () => {
    const normalized = normalizeTicketmasterEvent({
      id: "abc",
      name: "Minimal Event",
      dates: { start: { dateTime: "2026-08-02T00:00:00Z" } },
    } as TicketmasterEvent)

    expect("error" in normalized).toBe(false)
    if ("error" in normalized) return
    expect(normalized.description).toBeNull()
    expect(normalized.ends_at).toBeNull()
  })

  it("returns error for cancelled event missing start", () => {
    const normalized = normalizeTicketmasterEvent({
      id: "cancelled-1",
      name: "Cancelled Show",
      dates: { status: { code: "cancelled" } },
    } as TicketmasterEvent)

    expect("error" in normalized).toBe(true)
  })
})
