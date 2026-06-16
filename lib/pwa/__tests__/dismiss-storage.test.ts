import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PWA_DISMISS_COOLDOWN_MS, PWA_DISMISS_STORAGE_KEY } from "../constants"
import { getDismissedAt, isWithinCooldown, setDismissedNow } from "../dismiss-storage"

describe("dismiss-storage", () => {
  const store: Record<string, string> = {}

  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key]

    const localStorage = {
      getItem(key: string) {
        return store[key] ?? null
      },
      setItem(key: string, value: string) {
        store[key] = value
      },
    }

    vi.stubGlobal("window", { localStorage })
    vi.stubGlobal("localStorage", localStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns null when never dismissed", () => {
    expect(getDismissedAt()).toBeNull()
    expect(isWithinCooldown()).toBe(false)
  })

  it("stores dismiss timestamp", () => {
    const now = 1_700_000_000_000
    vi.setSystemTime(now)
    setDismissedNow()
    expect(getDismissedAt()).toBe(now)
    expect(localStorage.getItem(PWA_DISMISS_STORAGE_KEY)).toBe(String(now))
  })

  it("respects cooldown window", () => {
    const now = 1_700_000_000_000
    vi.setSystemTime(now)
    setDismissedNow()

    expect(isWithinCooldown(now + PWA_DISMISS_COOLDOWN_MS - 1)).toBe(true)
    expect(isWithinCooldown(now + PWA_DISMISS_COOLDOWN_MS)).toBe(false)
  })
})
