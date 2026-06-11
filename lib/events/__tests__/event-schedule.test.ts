import { describe, expect, it } from "vitest"

import {
  assertEventAcceptsPublicRegistration,
  getEventEffectiveEndMs,
  isEventPast,
  isEventUpcomingOrOngoing,
} from "@/lib/events/event-schedule"

const NOW = new Date("2026-06-15T20:00:00.000Z").getTime()

describe("event-schedule", () => {
  it("uses starts_at when ends_at is missing", () => {
    const startsAt = "2026-06-15T19:00:00.000Z"
    expect(getEventEffectiveEndMs(startsAt, null)).toBe(new Date(startsAt).getTime())
  })

  it("treats future starts_at with no ends_at as upcoming", () => {
    expect(isEventUpcomingOrOngoing("2026-06-16T19:00:00.000Z", null, NOW)).toBe(true)
    expect(isEventPast("2026-06-16T19:00:00.000Z", null, NOW)).toBe(false)
  })

  it("treats past starts_at with no ends_at as past", () => {
    expect(isEventUpcomingOrOngoing("2026-06-14T19:00:00.000Z", null, NOW)).toBe(false)
    expect(isEventPast("2026-06-14T19:00:00.000Z", null, NOW)).toBe(true)
  })

  it("treats started event with future ends_at as upcoming", () => {
    expect(
      isEventUpcomingOrOngoing("2026-06-15T18:00:00.000Z", "2026-06-15T22:00:00.000Z", NOW),
    ).toBe(true)
  })

  it("treats event with past ends_at as past", () => {
    expect(
      isEventUpcomingOrOngoing("2026-06-15T18:00:00.000Z", "2026-06-15T19:00:00.000Z", NOW),
    ).toBe(false)
    expect(isEventPast("2026-06-15T18:00:00.000Z", "2026-06-15T19:00:00.000Z", NOW)).toBe(true)
  })

  it("treats effective end equal to now as past (not upcoming)", () => {
    const end = "2026-06-15T20:00:00.000Z"
    expect(isEventUpcomingOrOngoing("2026-06-15T18:00:00.000Z", end, NOW)).toBe(false)
    expect(isEventPast("2026-06-15T18:00:00.000Z", end, NOW)).toBe(true)
    expect(isEventUpcomingOrOngoing("2026-06-15T20:00:00.000Z", null, NOW)).toBe(false)
    expect(isEventPast("2026-06-15T20:00:00.000Z", null, NOW)).toBe(true)
  })

  it("assertEventAcceptsPublicRegistration rejects past events", () => {
    expect(
      assertEventAcceptsPublicRegistration("2026-06-14T19:00:00.000Z", null, NOW),
    ).toEqual({ ok: false, error: "This event has already ended." })
    expect(
      assertEventAcceptsPublicRegistration("2026-06-16T19:00:00.000Z", null, NOW),
    ).toEqual({ ok: true })
  })
})
