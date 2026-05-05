"use client"

import { useEffect, useRef } from "react"

/** Fires once per client mount for published `/events/[slug]` (approximate opens). */
export function EventPublicViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    const s = slug.trim()
    if (!s) return
    void fetch(`/api/events/${encodeURIComponent(s)}/view`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    }).catch(() => {})
  }, [slug])

  return null
}
