import { describe, expect, it, vi } from "vitest"

import { mapAuthError } from "../auth-error-map"

describe("mapAuthError", () => {
  it("maps duplicate signup to account exists with sign-in CTA", () => {
    const m = mapAuthError({ message: "User already registered" }, "signup")
    expect(m.code).toBe("account_exists")
    expect(m.title).toMatch(/account already exists/i)
    expect(m.primaryAction?.href).toBe("/login")
  })

  it("maps invalid login credentials", () => {
    const m = mapAuthError({ message: "Invalid login credentials" }, "login")
    expect(m.code).toBe("invalid_credentials")
    expect(m.title).toMatch(/wrong email or password/i)
    expect(m.primaryAction?.href).toBe("/auth/forgot-password")
  })

  it("maps email not confirmed to verify guidance", () => {
    const m = mapAuthError({ message: "Email not confirmed" }, "login")
    expect(m.code).toBe("email_not_verified")
    expect(m.primaryAction?.href).toBe("/auth/sign-up-success")
  })

  it("maps rate limit for signup", () => {
    const m = mapAuthError({ message: "Too many requests", status: 429 }, "signup")
    expect(m.code).toBe("rate_limited")
    expect(m.title).toMatch(/slow down/i)
  })

  it("maps network-style fetch errors", () => {
    const m = mapAuthError({ message: "TypeError: Failed to fetch", name: "AuthRetryableFetchError" }, "login")
    expect(m.code).toBe("network_error")
  })

  it("uses onGenericRetry for unknown errors when provided", () => {
    const retry = vi.fn()
    const m = mapAuthError({ message: "Some new provider string" }, "signup", { onGenericRetry: retry })
    expect(m.code).toBe("unknown_error")
    m.primaryAction?.onClick?.()
    expect(retry).toHaveBeenCalledOnce()
  })

  it("falls back unknown when message is empty", () => {
    const m = mapAuthError({}, "login", { onGenericRetry: () => {} })
    expect(m.code).toBe("unknown_error")
  })
})
