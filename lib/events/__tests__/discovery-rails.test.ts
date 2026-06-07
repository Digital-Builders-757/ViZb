import { describe, expect, it } from "vitest"
import { buildDiscoveryRails, type DiscoveryRailEvent } from "../discovery-rails"

function evt(
  id: string,
  overrides: Partial<DiscoveryRailEvent> = {},
): DiscoveryRailEvent {
  return {
    id,
    event_kind: "official",
    is_staff_pick: false,
    starts_at: "2026-06-01T12:00:00.000Z",
    ...overrides,
  }
}

describe("buildDiscoveryRails", () => {
  it("routes official events to trending", () => {
    const upcoming = [
      evt("o1", { event_kind: "official" }),
      evt("c1", { event_kind: "community" }),
      evt("o2", { event_kind: "official" }),
    ]

    const { trending, staffPicks } = buildDiscoveryRails(upcoming)

    expect(trending.map((e) => e.id)).toEqual(["o1", "o2"])
    expect(staffPicks).toEqual([])
  })

  it("excludes staff picks from trending", () => {
    const upcoming = [
      evt("o1", { event_kind: "official", is_staff_pick: true }),
      evt("o2", { event_kind: "official" }),
      evt("c1", { event_kind: "community", is_staff_pick: true }),
      evt("c2", { event_kind: "community" }),
    ]

    const { trending, staffPicks } = buildDiscoveryRails(upcoming)

    expect(staffPicks.map((e) => e.id)).toEqual(["o1", "c1"])
    expect(trending.map((e) => e.id)).toEqual(["o2"])
  })

  it("falls back to upcoming minus staff picks when no official events", () => {
    const upcoming = [
      evt("c1", { event_kind: "community" }),
      evt("c2", { event_kind: "community" }),
      evt("c3", { event_kind: "community", is_staff_pick: true }),
    ]

    const { trending, staffPicks } = buildDiscoveryRails(upcoming)

    expect(staffPicks.map((e) => e.id)).toEqual(["c3"])
    expect(trending.map((e) => e.id)).toEqual(["c1", "c2"])
  })

  it("enforces slice limits", () => {
    const upcoming = [
      ...Array.from({ length: 5 }, (_, i) => evt(`o${i}`, { event_kind: "official" })),
      ...Array.from({ length: 8 }, (_, i) =>
        evt(`c${i}`, { event_kind: "community" }),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        evt(`s${i}`, { is_staff_pick: true }),
      ),
    ]

    const { trending, staffPicks } = buildDiscoveryRails(upcoming)

    expect(trending).toHaveLength(3)
    expect(staffPicks).toHaveLength(6)
  })
})
