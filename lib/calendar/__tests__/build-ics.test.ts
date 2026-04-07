import { describe, expect, it } from "vitest"
import { buildPublishedEventIcs, buildPublishedEventsIcs } from "../build-ics"

describe("buildPublishedEventsIcs", () => {
  it("includes multiple VEVENT blocks in one VCALENDAR", () => {
    const body = buildPublishedEventsIcs([
      {
        eventId: "11111111-1111-1111-1111-111111111111",
        title: "Event A",
        description: "Hi",
        startsAt: "2026-06-01T18:00:00.000Z",
        endsAt: "2026-06-01T20:00:00.000Z",
        venueName: "Venue A",
        city: "Norfolk",
        eventUrl: "https://example.com/events/a",
      },
      {
        eventId: "22222222-2222-2222-2222-222222222222",
        title: "Event B",
        description: null,
        startsAt: "2026-06-02T19:00:00.000Z",
        endsAt: null,
        venueName: "Venue B",
        city: "Richmond",
        eventUrl: "https://example.com/events/b",
      },
    ])

    expect(body.split("BEGIN:VEVENT").length - 1).toBe(2)
    expect(body).toContain("BEGIN:VCALENDAR")
    expect(body).toContain("END:VCALENDAR")
    expect(body).toContain("SUMMARY:Event A")
    expect(body).toContain("SUMMARY:Event B")
  })

  it("matches single-event helper shape for one row", () => {
    const one = {
      eventId: "33333333-3333-3333-3333-333333333333",
      title: "Solo",
      description: "x",
      startsAt: "2026-07-01T18:00:00.000Z",
      endsAt: "2026-07-01T19:00:00.000Z",
      venueName: "V",
      city: "C",
      eventUrl: "https://example.com/events/solo",
    }
    const a = buildPublishedEventIcs(one)
    const b = buildPublishedEventsIcs([one])
    expect(a).toBe(b)
  })
})
