import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isIOS, isMobileUserAgent, isSafari, isStandalone } from "../detect"

function mockNavigator(userAgent: string, extras: Record<string, unknown> = {}) {
  vi.stubGlobal("navigator", { userAgent, ...extras })
}

function mockWindow(options: {
  standalone?: boolean
  displayModeStandalone?: boolean
  msStream?: boolean
} = {}) {
  const matchMedia = vi.fn((query: string) => ({
    matches: query === "(display-mode: standalone)" && (options.displayModeStandalone ?? false),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))

  vi.stubGlobal("window", {
    matchMedia,
    ...(options.msStream ? { MSStream: {} } : {}),
  })

  if (options.standalone !== undefined) {
    mockNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", { standalone: options.standalone })
  }
}

describe("detect", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("isStandalone", () => {
    it("returns true for display-mode standalone", () => {
      mockWindow({ displayModeStandalone: true })
      mockNavigator("Mozilla/5.0")
      expect(isStandalone()).toBe(true)
    })

    it("returns true for iOS navigator.standalone", () => {
      mockWindow()
      mockNavigator("Mozilla/5.0 (iPhone)", { standalone: true })
      expect(isStandalone()).toBe(true)
    })

    it("returns false in normal browser mode", () => {
      mockWindow({ displayModeStandalone: false })
      mockNavigator("Mozilla/5.0 (Linux; Android 14)")
      expect(isStandalone()).toBe(false)
    })
  })

  describe("isIOS", () => {
    it("detects iPhone user agent", () => {
      mockWindow()
      mockNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15")
      expect(isIOS()).toBe(true)
    })

    it("excludes IE11 MSStream edge case", () => {
      mockWindow({ msStream: true })
      mockNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
      expect(isIOS()).toBe(false)
    })

    it("returns false for Android", () => {
      mockWindow()
      mockNavigator("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile")
      expect(isIOS()).toBe(false)
    })
  })

  describe("isSafari", () => {
    it("detects mobile Safari", () => {
      mockWindow()
      mockNavigator(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      )
      expect(isSafari()).toBe(true)
    })

    it("excludes Chrome on iOS", () => {
      mockWindow()
      mockNavigator(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
      )
      expect(isSafari()).toBe(false)
    })
  })

  describe("isMobileUserAgent", () => {
    it("detects Android mobile", () => {
      mockWindow()
      mockNavigator("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36")
      expect(isMobileUserAgent()).toBe(true)
    })

    it("returns false for desktop", () => {
      mockWindow()
      mockNavigator("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")
      expect(isMobileUserAgent()).toBe(false)
    })
  })
})
