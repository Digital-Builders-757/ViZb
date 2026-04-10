import { describe, it, expect } from "vitest"
import { getSafeRedirectPath, slugify } from "../utils"

describe("getSafeRedirectPath", () => {
  const FALLBACK = "/dashboard"

  // --- Should return fallback ---
  it("returns fallback for null", () => {
    expect(getSafeRedirectPath(null)).toBe(FALLBACK)
  })

  it("returns fallback for empty string", () => {
    expect(getSafeRedirectPath("")).toBe(FALLBACK)
  })

  it("rejects absolute URL (https://evil.com)", () => {
    expect(getSafeRedirectPath("https://evil.com")).toBe(FALLBACK)
  })

  it("rejects protocol-relative URL (//evil.com)", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe(FALLBACK)
  })

  it("rejects backslash-based bypass (/\\evil.com)", () => {
    expect(getSafeRedirectPath("/\\evil.com")).toBe(FALLBACK)
  })

  it("rejects percent-encoded bypass (/%2Fevil.com)", () => {
    expect(getSafeRedirectPath("/%2Fevil.com")).toBe(FALLBACK)
  })

  it("rejects unknown path prefix (/unknown-page)", () => {
    expect(getSafeRedirectPath("/unknown-page")).toBe(FALLBACK)
  })

  it("rejects root path (/)", () => {
    expect(getSafeRedirectPath("/")).toBe(FALLBACK)
  })

  it("rejects login path (/login)", () => {
    expect(getSafeRedirectPath("/login")).toBe(FALLBACK)
  })

  // --- Should pass through safe paths ---
  it("allows /dashboard", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard")
  })

  it("allows /dashboard subpaths", () => {
    expect(getSafeRedirectPath("/dashboard/tickets")).toBe("/dashboard/tickets")
  })

  it("allows /organizer subpath", () => {
    expect(getSafeRedirectPath("/organizer/my-org")).toBe("/organizer/my-org")
  })

  it("allows /admin", () => {
    expect(getSafeRedirectPath("/admin")).toBe("/admin")
  })

  it("allows /profile", () => {
    expect(getSafeRedirectPath("/profile")).toBe("/profile")
  })

  it("allows /host/apply", () => {
    expect(getSafeRedirectPath("/host/apply")).toBe("/host/apply")
  })

  it("allows /invite/claim with query params", () => {
    expect(getSafeRedirectPath("/invite/claim?code=abc123")).toBe("/invite/claim?code=abc123")
  })

  it("allows /tickets and ticket detail paths", () => {
    expect(getSafeRedirectPath("/tickets")).toBe("/tickets")
    expect(
      getSafeRedirectPath("/tickets/550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("/tickets/550e8400-e29b-41d4-a716-446655440000")
  })

  it("allows /events and detail slug", () => {
    expect(getSafeRedirectPath("/events")).toBe("/events")
    expect(getSafeRedirectPath("/events/summer-jam")).toBe("/events/summer-jam")
  })

  it("allows /events with query params (category filter)", () => {
    expect(getSafeRedirectPath("/events?category=Party")).toBe("/events?category=Party")
  })

  it("allows /advertise", () => {
    expect(getSafeRedirectPath("/advertise")).toBe("/advertise")
  })
})

describe("slugify", () => {
  it("converts simple text", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("strips special characters", () => {
    expect(slugify("My Event! @ The Club")).toBe("my-event-the-club")
  })

  it("collapses multiple dashes", () => {
    expect(slugify("too---many---dashes")).toBe("too-many-dashes")
  })

  it("trims leading/trailing dashes", () => {
    expect(slugify("--hello--")).toBe("hello")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("handles underscores", () => {
    expect(slugify("my_event_title")).toBe("my-event-title")
  })
})
