import { describe, expect, it } from "vitest"

import { getEventEffectiveEndMs } from "@/lib/events/event-schedule"
import {
  getTicketEventPhase,
  partitionWalletRowsByEffectiveEnd,
} from "@/lib/dashboard/ticket-wallet-shared"

describe("partitionWalletRowsByEffectiveEnd", () => {
  const NOW = new Date("2026-06-15T20:00:00.000Z").getTime()

  it("uses effective end instead of start for upcoming vs past", () => {
    const startedStillOngoing = {
      eventEffectiveEndMs: getEventEffectiveEndMs(
        "2026-06-15T18:00:00.000Z",
        "2026-06-15T22:00:00.000Z",
      ),
    }
    const ended = {
      eventEffectiveEndMs: getEventEffectiveEndMs(
        "2026-06-15T18:00:00.000Z",
        "2026-06-15T19:00:00.000Z",
      ),
    }

    const { upcoming, past } = partitionWalletRowsByEffectiveEnd([startedStillOngoing, ended], NOW)
    expect(upcoming).toHaveLength(1)
    expect(past).toHaveLength(1)
  })

  it("puts undated events in the undated bucket (active tickets)", () => {
    const undated = { eventEffectiveEndMs: null }
    const { upcoming, past, undated: undatedRows } = partitionWalletRowsByEffectiveEnd([undated], NOW)
    expect(upcoming).toHaveLength(0)
    expect(past).toHaveLength(0)
    expect(undatedRows).toHaveLength(1)
  })

  it("returns all rows in past when every event has ended", () => {
    const pastA = {
      eventEffectiveEndMs: getEventEffectiveEndMs("2026-06-10T18:00:00.000Z", "2026-06-10T22:00:00.000Z"),
    }
    const pastB = {
      eventEffectiveEndMs: getEventEffectiveEndMs("2026-06-01T18:00:00.000Z", null),
    }
    const { upcoming, past, undated } = partitionWalletRowsByEffectiveEnd([pastA, pastB], NOW)
    expect(upcoming).toHaveLength(0)
    expect(undated).toHaveLength(0)
    expect(past).toHaveLength(2)
  })
})

describe("getTicketEventPhase", () => {
  const NOW = new Date("2026-06-15T20:00:00.000Z").getTime()

  it("treats null effective end as upcoming", () => {
    expect(getTicketEventPhase(null, NOW)).toBe("upcoming")
  })

  it("marks events past effective end as past", () => {
    const endMs = getEventEffectiveEndMs("2026-06-14T18:00:00.000Z", "2026-06-14T22:00:00.000Z")
    expect(getTicketEventPhase(endMs, NOW)).toBe("past")
  })

  it("keeps ongoing events as upcoming until effective end", () => {
    const endMs = getEventEffectiveEndMs("2026-06-15T18:00:00.000Z", "2026-06-15T23:00:00.000Z")
    expect(getTicketEventPhase(endMs, NOW)).toBe("upcoming")
  })
})
