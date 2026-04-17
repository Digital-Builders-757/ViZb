import { afterEach, describe, it, expect, vi } from "vitest"
import {
  getPublicLineupAbsoluteUrl,
  getPublicLineupPath,
  getPublicLineupShareTarget,
  normalizePublicSiteUrl,
} from "../public-site-url"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("normalizePublicSiteUrl", () => {
  it("trims and strips trailing slash", () => {
    expect(normalizePublicSiteUrl("  https://ex.com/  ")).toBe("https://ex.com")
  })

  it("returns empty for missing", () => {
    expect(normalizePublicSiteUrl(undefined)).toBe("")
  })
})

describe("getPublicLineupPath", () => {
  it("encodes the slug segment", () => {
    expect(getPublicLineupPath("signal-91")).toBe("/lineup/signal-91")
    expect(getPublicLineupPath("a b")).toBe("/lineup/a%20b")
  })
})

describe("getPublicLineupAbsoluteUrl", () => {
  it("returns null when NEXT_PUBLIC_SITE_URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    expect(getPublicLineupAbsoluteUrl("signal-91")).toBe(null)
  })

  it("joins origin and path when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.example.com/")
    expect(getPublicLineupAbsoluteUrl("signal-91")).toBe("https://www.example.com/lineup/signal-91")
  })
})

describe("getPublicLineupShareTarget", () => {
  it("falls back to path when origin missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    expect(getPublicLineupShareTarget("signal-91")).toBe("/lineup/signal-91")
  })
})
