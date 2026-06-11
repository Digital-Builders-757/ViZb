import { describe, expect, it } from "vitest"

import { getEventEffectiveEndMs } from "@/lib/events/event-schedule"
import { partitionWalletRowsByEffectiveEnd } from "@/lib/dashboard/ticket-wallet-shared"

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
})
