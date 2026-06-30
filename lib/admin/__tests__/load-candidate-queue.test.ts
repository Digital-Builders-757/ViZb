import { describe, expect, it } from "vitest"
import {
  buildCandidateQueueQueryString,
  parseCandidateQueueParams,
  CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE,
} from "@/lib/admin/candidate-queue-params"

describe("parseCandidateQueueParams", () => {
  it("defaults page and page size", () => {
    const filters = parseCandidateQueueParams({})
    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE)
  })

  it("parses source and review filters", () => {
    const filters = parseCandidateQueueParams({
      source: "ticketmaster",
      reviewStatus: "pending_review",
      duplicateStatus: "likely",
      freshness: "stale",
      runId: "11111111-1111-4111-8111-111111111111",
      city: "Norfolk",
      page: "2",
      pageSize: "50",
    })
    expect(filters.sourceKey).toBe("ticketmaster")
    expect(filters.reviewStatus).toBe("pending_review")
    expect(filters.duplicateStatus).toBe("likely")
    expect(filters.freshness).toBe("stale")
    expect(filters.runId).toBe("11111111-1111-4111-8111-111111111111")
    expect(filters.city).toBe("Norfolk")
    expect(filters.page).toBe(2)
    expect(filters.pageSize).toBe(50)
  })

  it("caps page size at maximum", () => {
    const filters = parseCandidateQueueParams({ pageSize: "500" })
    expect(filters.pageSize).toBe(100)
  })
})

describe("buildCandidateQueueQueryString", () => {
  it("builds query string from filters", () => {
    const qs = buildCandidateQueueQueryString(
      parseCandidateQueueParams({
      source: "eventbrite",
      reviewStatus: "pending_review",
      freshness: "recent",
    }),
  )
  expect(qs).toContain("source=eventbrite")
  expect(qs).toContain("reviewStatus=pending_review")
  expect(qs).toContain("freshness=recent")
})
})
