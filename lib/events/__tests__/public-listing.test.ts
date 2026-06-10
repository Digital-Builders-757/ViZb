import { describe, expect, it } from "vitest"

import { isPublicListingEventStatus, PUBLIC_EVENT_LISTING_STATUS } from "@/lib/events/public-listing"

describe("isPublicListingEventStatus", () => {
  it("allows only published", () => {
    expect(isPublicListingEventStatus(PUBLIC_EVENT_LISTING_STATUS)).toBe(true)
    expect(isPublicListingEventStatus("published")).toBe(true)
  })

  it("rejects archived and other non-public statuses", () => {
    expect(isPublicListingEventStatus("archived")).toBe(false)
    expect(isPublicListingEventStatus("draft")).toBe(false)
    expect(isPublicListingEventStatus("cancelled")).toBe(false)
    expect(isPublicListingEventStatus("pending_review")).toBe(false)
    expect(isPublicListingEventStatus(null)).toBe(false)
  })
})
