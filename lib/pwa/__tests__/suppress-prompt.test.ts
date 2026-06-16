import { describe, it, expect } from "vitest"

import { shouldSuppressInstallPrompt } from "../suppress-prompt"

describe("shouldSuppressInstallPrompt", () => {
  it("suppresses auth paths", () => {
    expect(shouldSuppressInstallPrompt("/login")).toBe(true)
    expect(shouldSuppressInstallPrompt("/signup")).toBe(true)
    expect(shouldSuppressInstallPrompt("/auth/forgot-password")).toBe(true)
    expect(shouldSuppressInstallPrompt("/auth/reset-password")).toBe(true)
    expect(shouldSuppressInstallPrompt("/invite/claim")).toBe(true)
  })

  it("suppresses modal-heavy form paths", () => {
    expect(shouldSuppressInstallPrompt("/advertise")).toBe(true)
    expect(shouldSuppressInstallPrompt("/host/apply")).toBe(true)
  })

  it("suppresses event pages with transactional query params", () => {
    expect(
      shouldSuppressInstallPrompt("/events/summer-block-party", new URLSearchParams("session_id=cs_test")),
    ).toBe(true)
    expect(
      shouldSuppressInstallPrompt("/events/summer-block-party", new URLSearchParams("checkout=cancelled")),
    ).toBe(true)
    expect(
      shouldSuppressInstallPrompt("/events/summer-block-party", new URLSearchParams("intent=rsvp_event")),
    ).toBe(true)
  })

  it("allows general browsing paths", () => {
    expect(shouldSuppressInstallPrompt("/")).toBe(false)
    expect(shouldSuppressInstallPrompt("/events")).toBe(false)
    expect(shouldSuppressInstallPrompt("/events/summer-block-party")).toBe(false)
    expect(shouldSuppressInstallPrompt("/about")).toBe(false)
    expect(shouldSuppressInstallPrompt("/p/some-post")).toBe(false)
  })

  it("allows event detail without transactional query params", () => {
    expect(
      shouldSuppressInstallPrompt("/events/summer-block-party", new URLSearchParams("utm_source=ig")),
    ).toBe(false)
  })
})
