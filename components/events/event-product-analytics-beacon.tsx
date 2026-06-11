"use client"

import { useEffect, useRef } from "react"

import { trackProductEvent, type ProductEventContext } from "@/lib/analytics/product-events"

/** Fires `event_detail_viewed` once per client mount. */
export function EventProductAnalyticsBeacon({ context }: { context: ProductEventContext }) {
  const sent = useRef(false)
  const { event_slug, city, category, event_kind, staff_pick, signed_in, source } = context

  useEffect(() => {
    if (sent.current || !event_slug) return
    sent.current = true
    trackProductEvent("event_detail_viewed", {
      event_slug,
      city,
      category,
      event_kind,
      staff_pick,
      signed_in,
      source: source ?? "event_detail",
    })
  }, [category, city, event_kind, event_slug, signed_in, source, staff_pick])

  return null
}
