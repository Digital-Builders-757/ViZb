import { describe, expect, it } from "vitest"

import {
  appendIntentToPath,
  buildAuthHref,
  buildEventAuthHref,
  isPostLoginIntent,
  parsePostLoginIntent,
  resolvePostLoginDestination,
} from "@/lib/auth/post-login-intent"

describe("post-login-intent", () => {
  it("accepts allowlisted intents only", () => {
    expect(isPostLoginIntent("save_event")).toBe(true)
    expect(isPostLoginIntent("rsvp_event")).toBe(true)
    expect(isPostLoginIntent("delete_account")).toBe(false)
    expect(isPostLoginIntent("https://evil.com")).toBe(false)
    expect(isPostLoginIntent(null)).toBe(false)
  })

  it("parses intent from search params", () => {
    const params = new URLSearchParams("intent=save_event&foo=bar")
    expect(parsePostLoginIntent(params)).toBe("save_event")
    expect(parsePostLoginIntent(new URLSearchParams("intent=evil"))).toBe(null)
  })

  it("appends intent to path without dropping existing query", () => {
    expect(appendIntentToPath("/events/foo", "save_event")).toBe("/events/foo?intent=save_event")
    expect(appendIntentToPath("/events/foo?session_id=abc", "rsvp_event")).toBe(
      "/events/foo?session_id=abc&intent=rsvp_event",
    )
    expect(appendIntentToPath("/events/foo", null)).toBe("/events/foo")
  })

  it("builds auth href with redirect and intent", () => {
    const href = buildEventAuthHref("summer-jam", "save_event")
    expect(href).toContain("/login?")
    expect(href).toContain("intent=save_event")
    expect(decodeURIComponent(href)).toContain("redirect=/events/summer-jam")
  })

  it("buildAuthHref omits invalid intent", () => {
    const href = buildAuthHref({ redirectPath: "/dashboard", intent: null })
    expect(href).toBe("/login?redirect=%2Fdashboard")
  })

  it("resolvePostLoginDestination merges redirect and intent", () => {
    expect(resolvePostLoginDestination("/events/x", "rsvp_event")).toBe("/events/x?intent=rsvp_event")
  })
})
