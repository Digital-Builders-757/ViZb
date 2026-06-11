import { describe, expect, it } from "vitest"
import {
  buildReminderDedupKey,
  eventStartInReminderWindow,
} from "@/lib/notifications/reminder-windows"

describe("reminder windows", () => {
  it("builds stable dedup keys", () => {
    expect(buildReminderDedupKey("saved", "24h", "abc")).toBe("saved:24h:abc")
  })

  it("matches events in the 24h band", () => {
    const now = new Date("2026-06-10T12:00:00.000Z").getTime()
    const startsAt = new Date("2026-06-11T12:00:00.000Z").toISOString()
    expect(eventStartInReminderWindow(startsAt, "24h", now)).toBe(true)
  })

  it("rejects events outside the band", () => {
    const now = new Date("2026-06-10T12:00:00.000Z").getTime()
    const startsAt = new Date("2026-06-13T12:00:00.000Z").toISOString()
    expect(eventStartInReminderWindow(startsAt, "24h", now)).toBe(false)
  })
})
