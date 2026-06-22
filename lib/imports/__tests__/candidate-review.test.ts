import { describe, expect, it } from "vitest"
import {
  buildCandidateReviewPlan,
  canPublishCandidate,
  type CandidateReviewRow,
} from "@/lib/imports/candidate-review"

function baseCandidate(overrides: Partial<CandidateReviewRow> = {}): CandidateReviewRow {
  return {
    id: "c-1",
    source_key: "ticketmaster",
    source_event_id: "tm-1",
    source_url: "https://ticketmaster.com/event/1",
    source_attribution: "Ticketmaster",
    source_payload: {},
    title: "Sample Event",
    description: null,
    starts_at: "2026-07-01T18:00:00.000Z",
    ends_at: null,
    timezone: "America/New_York",
    venue_name: "Scope Arena",
    address: "201 E Brambleton Ave",
    city: "Norfolk",
    region: "VA",
    postal_code: null,
    image_url: null,
    categories: ["concert"],
    classifications: {},
    organizer_hints: {},
    external_ticket_url: "https://ticketmaster.com/tickets/1",
    review_status: "pending_review",
    duplicate_status: "none",
    canonical_event_id: null,
    duplicate_match_evidence: {},
    rejection_reason: null,
    suppressed_until: null,
    last_import_run_id: "run-1",
    last_imported_at: "2026-06-20T12:00:00.000Z",
    ...overrides,
  }
}

describe("buildCandidateReviewPlan", () => {
  it("rejects a pending candidate", () => {
    const plan = buildCandidateReviewPlan(baseCandidate(), { action: "reject", notes: "spam" })
    expect(plan.ok).toBe(true)
    if (plan.ok) {
      expect(plan.newReviewStatus).toBe("rejected")
      expect(plan.auditAction).toBe("reject")
    }
  })

  it("suppresses a candidate", () => {
    const plan = buildCandidateReviewPlan(baseCandidate(), { action: "suppress" })
    expect(plan.ok).toBe(true)
    if (plan.ok) {
      expect(plan.newReviewStatus).toBe("suppressed")
    }
  })

  it("marks likely duplicate", () => {
    const plan = buildCandidateReviewPlan(baseCandidate(), { action: "mark_likely_duplicate" })
    expect(plan.ok).toBe(true)
    if (plan.ok) {
      expect(plan.newDuplicateStatus).toBe("likely")
    }
  })

  it("requires canonical event id for link", () => {
    const plan = buildCandidateReviewPlan(baseCandidate(), { action: "link" })
    expect(plan.ok).toBe(false)
  })

  it("blocks reject on approved listing", () => {
    const plan = buildCandidateReviewPlan(
      baseCandidate({ review_status: "approved_listing" }),
      { action: "reject" },
    )
    expect(plan.ok).toBe(false)
  })
})

describe("canPublishCandidate", () => {
  it("allows pending_review with no duplicate flag", () => {
    expect(canPublishCandidate(baseCandidate()).allowed).toBe(true)
  })

  it("blocks likely duplicates", () => {
    const result = canPublishCandidate(baseCandidate({ duplicate_status: "likely" }))
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("duplicate")
  })

  it("blocks suppressed candidates", () => {
    const result = canPublishCandidate(baseCandidate({ review_status: "suppressed" }))
    expect(result.allowed).toBe(false)
  })
})
