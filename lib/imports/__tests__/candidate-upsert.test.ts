import { describe, expect, it } from "vitest"
import { buildCandidateUpsertPlan } from "@/lib/imports/candidate-upsert"
import type { ExistingCandidateRow, NormalizedEventCandidate } from "@/lib/imports/types"

function baseCandidate(): NormalizedEventCandidate {
  return {
    source_key: "eventbrite",
    source_event_id: "123",
    source_url: "https://www.eventbrite.com/e/123",
    source_attribution: "Eventbrite",
    source_payload: { id: "123" },
    source_payload_hash: "abc",
    source_status: null,
    title: "Neon Night",
    description: "Fun",
    starts_at: "2026-07-01T22:00:00Z",
    ends_at: "2026-07-02T02:00:00Z",
    timezone: "America/New_York",
    venue_name: "The Venue",
    address: "100 Main St",
    city: "Norfolk",
    region: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    image_url: null,
    categories: ["other"],
    classifications: {},
    organizer_hints: {},
    external_ticket_url: "https://www.eventbrite.com/e/123",
  }
}

function existing(overrides: Partial<ExistingCandidateRow> = {}): ExistingCandidateRow {
  return {
    id: "cand-1",
    review_status: "pending_review",
    source_payload_hash: "abc",
    duplicate_status: "none",
    canonical_event_id: null,
    suppressed_until: null,
    ...overrides,
  }
}

describe("buildCandidateUpsertPlan", () => {
  it("inserts when no existing row", () => {
    const plan = buildCandidateUpsertPlan(baseCandidate(), null, "run-1")
    expect(plan.action).toBe("insert")
    if (plan.action === "insert") {
      expect(plan.row.review_status).toBe("pending_review")
      expect(plan.row.source_key).toBe("eventbrite")
      expect(plan.row.last_import_run_id).toBe("run-1")
    }
  })

  it("skips rejected when payload unchanged", () => {
    const plan = buildCandidateUpsertPlan(baseCandidate(), existing({ review_status: "rejected" }), "run-1")
    expect(plan.action).toBe("skip")
    if (plan.action === "skip") {
      expect(plan.reason).toBe("rejected_unchanged")
    }
  })

  it("skips suppressed when payload unchanged", () => {
    const plan = buildCandidateUpsertPlan(
      baseCandidate(),
      existing({ review_status: "suppressed", suppressed_until: "2099-01-01T00:00:00Z" }),
      "run-1",
    )
    expect(plan.action).toBe("skip")
  })

  it("resets rejected to pending_review when payload changed", () => {
    const plan = buildCandidateUpsertPlan(
      { ...baseCandidate(), source_payload_hash: "new-hash" },
      existing({ review_status: "rejected" }),
      "run-1",
    )
    expect(plan.action).toBe("update")
    if (plan.action === "update") {
      expect(plan.patch.review_status).toBe("pending_review")
    }
  })

  it("updates source metadata only when approved_listing", () => {
    const plan = buildCandidateUpsertPlan(
      { ...baseCandidate(), title: "Changed Title" },
      existing({ review_status: "approved_listing", canonical_event_id: "ev-1" }),
      "run-1",
    )
    expect(plan.action).toBe("update")
    if (plan.action === "update") {
      expect(plan.patch.title).toBeUndefined()
      expect(plan.patch.source_payload_hash).toBe("abc")
    }
  })

  it("refreshes pending_review content on re-import", () => {
    const plan = buildCandidateUpsertPlan(
      { ...baseCandidate(), title: "Updated Title" },
      existing({ review_status: "pending_review" }),
      "run-1",
    )
    expect(plan.action).toBe("update")
    if (plan.action === "update") {
      expect(plan.patch.title).toBe("Updated Title")
    }
  })
})
