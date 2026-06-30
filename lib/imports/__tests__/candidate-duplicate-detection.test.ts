import { describe, expect, it } from "vitest"
import { detectCandidateDuplicates, type CandidateDuplicateComparable } from "@/lib/imports/candidate-duplicate-detection"
import type { NormalizedEventCandidate } from "@/lib/imports/types"

function baseCandidate(overrides: Partial<NormalizedEventCandidate> = {}): NormalizedEventCandidate {
  return {
    source_key: "ticketmaster",
    source_event_id: "tm-1",
    source_url: "https://ticketmaster.test/events/tm-1",
    source_attribution: "Ticketmaster",
    source_payload: {},
    source_payload_hash: "hash",
    source_status: null,
    title: "Neon Night Market",
    description: null,
    starts_at: "2026-07-01T22:00:00.000Z",
    ends_at: null,
    timezone: "America/New_York",
    venue_name: "The NorVa",
    address: null,
    city: "Norfolk",
    region: "VA",
    postal_code: null,
    latitude: null,
    longitude: null,
    image_url: null,
    categories: ["music"],
    classifications: {},
    organizer_hints: { name: "ViZb Presents" },
    external_ticket_url: "https://tickets.test/tm-1",
    ...overrides,
  }
}

function candidateMatch(overrides: Partial<CandidateDuplicateComparable> = {}): CandidateDuplicateComparable {
  return {
    id: "candidate-2",
    source_key: "eventbrite",
    source_event_id: "eb-2",
    source_url: "https://eventbrite.test/e/eb-2",
    external_ticket_url: "https://eventbrite.test/e/eb-2/tickets",
    title: "Neon Night Market",
    starts_at: "2026-07-01T22:45:00.000Z",
    venue_name: "NorVa",
    city: "Norfolk",
    organizer_hints: { name: "ViZb Presents" },
    canonical_event_id: null,
    ...overrides,
  }
}

describe("detectCandidateDuplicates", () => {
  it("marks exact native event matches as canonical", () => {
    const result = detectCandidateDuplicates(
      baseCandidate(),
      {
        candidates: [],
        events: [
          {
            id: "event-1",
            title: "Neon Night Market",
            starts_at: "2026-07-01T22:00:00.000Z",
            venue_name: "The NorVa",
            city: "Norfolk",
            source: "ticketmaster",
            source_event_id: "tm-1",
            source_url: "https://ticketmaster.test/events/tm-1",
            external_rsvp_url: null,
          },
        ],
      },
      "2026-06-30T12:00:00.000Z",
    )

    expect(result.status).toBe("exact")
    expect(result.canonicalEventId).toBe("event-1")
    expect(result.evidence.matches[0]?.signals).toContain("source_identity")
  })

  it("treats venue spelling differences and shifted times as likely duplicates", () => {
    const result = detectCandidateDuplicates(
      baseCandidate(),
      { candidates: [candidateMatch()], events: [] },
      "2026-06-30T12:00:00.000Z",
    )

    expect(result.status).toBe("likely")
    expect(result.canonicalEventId).toBeNull()
    expect(result.evidence.matches[0]?.signals).toEqual(
      expect.arrayContaining(["same_title", "shifted_start_time", "same_venue", "same_city"]),
    )
  })

  it("protects recurring names on different dates from false positives", () => {
    const result = detectCandidateDuplicates(
      baseCandidate({
        title: "Open Mic Night",
        starts_at: "2026-07-01T23:00:00.000Z",
        venue_name: "The Venue",
      }),
      {
        candidates: [
          candidateMatch({
            title: "Open Mic Night",
            starts_at: "2026-07-08T23:00:00.000Z",
            venue_name: "The Venue",
          }),
        ],
        events: [],
      },
      "2026-06-30T12:00:00.000Z",
    )

    expect(result.status).toBe("none")
    expect(result.evidence.matches).toEqual([])
  })

  it("does not flag similar titles in different cities and venues", () => {
    const result = detectCandidateDuplicates(
      baseCandidate({ title: "Summer Jazz Night" }),
      {
        candidates: [
          candidateMatch({
            title: "Summer Jazz Nights",
            starts_at: "2026-07-01T22:30:00.000Z",
            venue_name: "The National",
            city: "Richmond",
            organizer_hints: {},
          }),
        ],
        events: [],
      },
      "2026-06-30T12:00:00.000Z",
    )

    expect(result.status).toBe("none")
  })
})
