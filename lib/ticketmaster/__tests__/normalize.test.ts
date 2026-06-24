import { describe, expect, it } from "vitest"
import eventSample from "@/lib/ticketmaster/__tests__/fixtures/event-sample.json"
import eventLocalDateOnly from "@/lib/ticketmaster/__tests__/fixtures/event-local-date-only.json"
import {
  normalizeTicketmasterEvent,
  pickEventTimestampIso,
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

describe("pickEventTimestampIso", () => {
  it("prefers dateTime when present", () => {
    expect(
      pickEventTimestampIso({ dateTime: "2026-08-02T00:00:00Z" }, "America/New_York"),
    ).toBe("2026-08-02T00:00:00.000Z")
  })

  it("falls back to localDate and localTime in the event timezone", () => {
    expect(
      pickEventTimestampIso(
        { localDate: "2026-08-01", localTime: "19:00:00" },
        "America/New_York",
      ),
    ).toBe("2026-08-01T23:00:00.000Z")
  })

  it("uses noon local when timeTBA is true", () => {
    expect(
      pickEventTimestampIso(
        { localDate: "2026-09-15", timeTBA: true },
        "America/New_York",
      ),
    ).toBe("2026-09-15T16:00:00.000Z")
  })

  it("returns null for dateTBA events", () => {
    expect(pickEventTimestampIso({ dateTBA: true }, "America/New_York")).toBeNull()
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

  it("imports events with localDate only when timeTBA", () => {
    const normalized = normalizeTicketmasterEvent(eventLocalDateOnly as TicketmasterEvent)
    expect("error" in normalized).toBe(false)
    if ("error" in normalized) return

    expect(normalized.source_event_id).toBe("Z7r9jZ1A7x8J7")
    expect(normalized.starts_at).toBe("2026-09-15T16:00:00.000Z")
    expect(normalized.timezone).toBe("America/New_York")
  })

  it("imports events with localDate and localTime but no dateTime", () => {
    const normalized = normalizeTicketmasterEvent({
      id: "local-only",
      name: "Local Date Event",
      dates: {
        start: { localDate: "2026-10-01", localTime: "20:00:00" },
        timezone: "America/New_York",
      },
    } as TicketmasterEvent)

    expect("error" in normalized).toBe(false)
    if ("error" in normalized) return
    expect(normalized.starts_at).toBe("2026-10-02T00:00:00.000Z")
  })

  it("returns error for cancelled event missing start", () => {
    const normalized = normalizeTicketmasterEvent({
      id: "cancelled-1",
      name: "Cancelled Show",
      dates: { status: { code: "cancelled" } },
    } as TicketmasterEvent)

    expect("error" in normalized).toBe(true)
    if (!("error" in normalized)) return
    expect(normalized.error).toContain("missing start dateTime")
  })

  it("returns error for dateTBA events", () => {
    const normalized = normalizeTicketmasterEvent({
      id: "tba-1",
      name: "Date TBA Show",
      dates: {
        start: { dateTBA: true },
        timezone: "America/New_York",
      },
    } as TicketmasterEvent)

    expect("error" in normalized).toBe(true)
    if (!("error" in normalized)) return
    expect(normalized.error).toContain("TBA/TBD")
  })
})
