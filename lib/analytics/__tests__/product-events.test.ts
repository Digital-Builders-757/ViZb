import { describe, expect, it } from "vitest"

import {
  buildProductEventPayload,
  formatCategoriesForAnalytics,
  isProductEventName,
} from "@/lib/analytics/product-events"

describe("product-events", () => {
  it("recognizes product event names", () => {
    expect(isProductEventName("event_detail_viewed")).toBe(true)
    expect(isProductEventName("not_real")).toBe(false)
  })

  it("builds payload without PII fields", () => {
    const payload = buildProductEventPayload({
      event_slug: "summer-jam",
      city: "Norfolk",
      signed_in: true,
      ...({ email: "user@example.com", user_id: "abc-123" } as Record<string, string>),
    })

    expect(payload.event_slug).toBe("summer-jam")
    expect(payload.city).toBe("Norfolk")
    expect(payload.signed_in).toBe(true)
    expect(payload.email).toBeUndefined()
    expect(payload.user_id).toBeUndefined()
  })

  it("drops string values that look like emails", () => {
    const payload = buildProductEventPayload({
      source: "user@host.com",
    })
    expect(payload.source).toBeUndefined()
  })

  it("truncates long category strings", () => {
    const payload = buildProductEventPayload({
      category: "a".repeat(200),
    })
    expect(String(payload.category).length).toBeLessThanOrEqual(120)
  })

  it("formats categories for analytics", () => {
    expect(formatCategoriesForAnalytics(["music", "social", "workshop", "other"])).toBe(
      "music, social, workshop",
    )
  })
})
