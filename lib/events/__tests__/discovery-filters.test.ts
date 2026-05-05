import { describe, expect, it } from "vitest"
import {
  applyDiscoveryPreset,
  compareEventsByCityThenTime,
  easternDateKey,
  eventMatchesSearch,
  matchesFree,
  matchesTonight,
  matchesWeekend,
} from "../discovery-filters"

describe("matchesTonight", () => {
  it("matches when Eastern calendar day equals now", () => {
    const now = new Date("2026-07-15T04:00:00.000Z")
    const startSameEtDay = "2026-07-15T23:00:00.000Z"
    const startPrevEt = "2026-07-14T12:00:00.000Z"
    expect(matchesTonight(startSameEtDay, now)).toBe(true)
    expect(matchesTonight(startPrevEt, now)).toBe(false)
  })
})

describe("matchesWeekend", () => {
  it("matches Saturday and Sunday starts", () => {
    const now = new Date("2026-07-10T12:00:00.000Z")
    expect(matchesWeekend("2026-07-11T15:00:00.000Z", now)).toBe(true)
    expect(matchesWeekend("2026-07-12T15:00:00.000Z", now)).toBe(true)
  })

  it("matches Friday evening Eastern", () => {
    const now = new Date("2026-07-10T12:00:00.000Z")
    expect(matchesWeekend("2026-07-10T22:00:00.000Z", now)).toBe(true)
  })
})

describe("matchesFree", () => {
  const t0 = new Date("2026-01-01T12:00:00.000Z")

  it("treats community as free for discovery", () => {
    expect(matchesFree({ isCommunity: true, ticketTypes: [], now: t0 })).toBe(true)
  })

  it("official with no tiers is free", () => {
    expect(matchesFree({ isCommunity: false, ticketTypes: [], now: t0 })).toBe(true)
  })

  it("official with only on-sale paid tiers is not free", () => {
    expect(
      matchesFree({
        isCommunity: false,
        ticketTypes: [{ price_cents: 1500, sales_starts_at: null, sales_ends_at: null }],
        now: t0,
      }),
    ).toBe(false)
  })

  it("official with a zero tier on sale is free", () => {
    expect(
      matchesFree({
        isCommunity: false,
        ticketTypes: [
          { price_cents: 1500, sales_starts_at: null, sales_ends_at: null },
          { price_cents: 0, sales_starts_at: null, sales_ends_at: null },
        ],
        now: t0,
      }),
    ).toBe(true)
  })
})

describe("applyDiscoveryPreset", () => {
  const now = new Date("2026-03-10T12:00:00.000Z")

  it("open_mic requires category", () => {
    expect(
      applyDiscoveryPreset(
        "open_mic",
        {
          starts_at: "2026-03-15T12:00:00.000Z",
          categories: ["open_mic"],
          event_kind: "official",
          ticket_types: [],
        },
        now,
      ),
    ).toBe(true)
    expect(
      applyDiscoveryPreset(
        "open_mic",
        {
          starts_at: "2026-03-15T12:00:00.000Z",
          categories: ["party"],
          event_kind: "official",
          ticket_types: [],
        },
        now,
      ),
    ).toBe(false)
  })
})

describe("eventMatchesSearch", () => {
  it("matches title substring", () => {
    expect(
      eventMatchesSearch({
        title: "BeatNight 757",
        venue_name: "X",
        city: "VB",
        categories: [],
        orgName: "O",
        q: "beat",
      }),
    ).toBe(true)
  })

  it("empty query passes", () => {
    expect(
      eventMatchesSearch({
        title: "A",
        venue_name: "B",
        city: "C",
        categories: [],
        orgName: "D",
        q: "   ",
      }),
    ).toBe(true)
  })
})

describe("compareEventsByCityThenTime", () => {
  it("sorts by city then time", () => {
    const a = { city: "Norfolk", starts_at: "2026-04-02T12:00:00.000Z" }
    const b = { city: "Richmond", starts_at: "2026-04-01T12:00:00.000Z" }
    const c = { city: "Norfolk", starts_at: "2026-04-01T12:00:00.000Z" }
    const rows = [b, c, a].sort(compareEventsByCityThenTime)
    expect(rows.map((r) => r.city)).toEqual(["Norfolk", "Norfolk", "Richmond"])
    expect(rows[0].starts_at < rows[1].starts_at).toBe(true)
  })
})

describe("easternDateKey", () => {
  it("returns YYYY-MM-DD shape", () => {
    const k = easternDateKey("2026-01-15T12:00:00.000Z")
    expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
