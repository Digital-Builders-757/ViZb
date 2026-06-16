import { afterEach, describe, expect, it, vi } from "vitest"

import {
  computeOrganizerPayoutAvailableOn,
  getOrganizerPayoutDelayHours,
} from "@/lib/payments/organizer-payout-config"

describe("organizer payout config", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("defaults payout delay to 48 hours", () => {
    expect(getOrganizerPayoutDelayHours()).toBe(48)
  })

  it("clamps env delay between 24 and 72 hours", () => {
    vi.stubEnv("VIZB_PAYOUT_DELAY_HOURS", "12")
    expect(getOrganizerPayoutDelayHours()).toBe(24)

    vi.stubEnv("VIZB_PAYOUT_DELAY_HOURS", "96")
    expect(getOrganizerPayoutDelayHours()).toBe(72)
  })

  it("schedules available_on from event end plus delay", () => {
    vi.stubEnv("VIZB_PAYOUT_DELAY_HOURS", "24")
    const availableOn = computeOrganizerPayoutAvailableOn(
      "2026-06-01T22:00:00.000Z",
      "2026-06-01T19:00:00.000Z",
    )
    expect(availableOn.toISOString()).toBe("2026-06-02T22:00:00.000Z")
  })

  it("falls back to starts_at when ends_at is missing", () => {
    vi.stubEnv("VIZB_PAYOUT_DELAY_HOURS", "48")
    const availableOn = computeOrganizerPayoutAvailableOn(null, "2026-06-01T19:00:00.000Z")
    expect(availableOn.toISOString()).toBe("2026-06-03T19:00:00.000Z")
  })
})
