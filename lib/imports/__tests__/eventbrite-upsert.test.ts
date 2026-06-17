import { describe, expect, it } from "vitest"
import { buildEventbriteUpsertPlan } from "@/lib/imports/eventbrite-upsert"
import type { EventbriteImportCandidate } from "@/lib/imports/eventbrite-normalize"

function baseCandidate(): EventbriteImportCandidate {
  return {
    title: "Neon Night",
    description: "Fun",
    starts_at: "2026-07-01T22:00:00Z",
    ends_at: "2026-07-02T02:00:00Z",
    timezone: "America/New_York",
    venue_name: "The Venue",
    address: "100 Main St",
    city: "Norfolk",
    source_url: "https://www.eventbrite.com/e/123",
    flyer_url: null,
    source: "eventbrite",
    source_event_id: "123",
    source_payload: { id: "123" },
    source_payload_hash: "abc",
    import_status: "pending_review",
    external_rsvp_url: "https://www.eventbrite.com/e/123",
    event_kind: "community",
    categories: ["other"],
  }
}

describe("buildEventbriteUpsertPlan", () => {
  it("inserts when no existing row", () => {
    const plan = buildEventbriteUpsertPlan(baseCandidate(), null, "neon-night", "org-1")
    expect(plan.action).toBe("insert")
    if (plan.action === "insert") {
      expect(plan.row.status).toBe("pending_review")
      expect(plan.row.org_id).toBe("org-1")
    }
  })

  it("skips rejected when payload unchanged", () => {
    const plan = buildEventbriteUpsertPlan(baseCandidate(), {
      id: "ev-1",
      status: "rejected",
      slug: "neon-night",
      source_payload_hash: "abc",
      title: "Neon Night",
      starts_at: "2026-07-01T22:00:00Z",
      city: "Norfolk",
      venue_name: "The Venue",
    }, "neon-night", "org-1")
    expect(plan.action).toBe("skip")
  })

  it("does not overwrite editorial fields when published", () => {
    const plan = buildEventbriteUpsertPlan(baseCandidate(), {
      id: "ev-1",
      status: "published",
      slug: "neon-night",
      source_payload_hash: "old",
      title: "Old Title",
      starts_at: "2026-07-01T22:00:00Z",
      city: "Norfolk",
      venue_name: "The Venue",
    }, "neon-night", "org-1")
    expect(plan.action).toBe("update")
    if (plan.action === "update") {
      expect(plan.patch.title).toBeUndefined()
      expect(plan.patch.last_imported_at).toBeDefined()
    }
  })
})
