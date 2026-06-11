import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { buildTicketQrToken } from "@/lib/ticket-qr-token"

const EVENT_ID = "11111111-1111-4111-8111-111111111111"
const REG_ID = "22222222-2222-4222-8222-222222222222"
const USER_ID = "33333333-3333-4333-8333-333333333333"
const SECRET = "test-secret-at-least-16-chars"

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockIsServerSupabaseConfigured = vi.fn()
const mockGetTicketQrSecret = vi.fn()
const mockAssertCheckInScanAllowed = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
  isServerSupabaseConfigured: () => mockIsServerSupabaseConfigured(),
}))

vi.mock("@/lib/ticket-qr-token", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ticket-qr-token")>()
  return {
    ...actual,
    getTicketQrSecret: () => mockGetTicketQrSecret(),
  }
})

vi.mock("@/lib/checkin-scan-permissions", () => ({
  assertCheckInScanAllowed: (...args: unknown[]) => mockAssertCheckInScanAllowed(...args),
}))

function buildToken(expOffsetSeconds = 3600) {
  return buildTicketQrToken(
    {
      v: 1,
      eid: EVENT_ID,
      rid: REG_ID,
      exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
    },
    SECRET,
  )
}

function registrationChain(reg: {
  id: string
  user_id: string
  status: string
  checked_in_at?: string | null
}) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: reg, error: null }),
        }),
        maybeSingle: vi.fn().mockResolvedValue({ data: reg, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: reg.id, checked_in_at: new Date().toISOString() },
                error: null,
              }),
            }),
          }),
        }),
      }),
    }),
  }
}

describe("POST /api/checkin/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsServerSupabaseConfigured.mockReturnValue(true)
    mockGetTicketQrSecret.mockReturnValue(SECRET)
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } })
    mockAssertCheckInScanAllowed.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns 503 when TICKET_QR_SECRET is missing", async () => {
    mockGetTicketQrSecret.mockReturnValue(null)
    const { POST } = await import("../route")
    const res = await POST(
      new NextRequest("http://localhost/api/checkin/scan", {
        method: "POST",
        body: JSON.stringify({ token: buildToken(), eventId: EVENT_ID }),
      }),
    )
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.code).toBe("scanner_not_configured")
  })

  it("rejects invalid token signatures", async () => {
    const { POST } = await import("../route")
    const res = await POST(
      new NextRequest("http://localhost/api/checkin/scan", {
        method: "POST",
        body: JSON.stringify({ token: `${buildToken()}.tampered`, eventId: EVENT_ID }),
      }),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.ok).toBe(false)
  })

  it("rejects non-staff users", async () => {
    mockAssertCheckInScanAllowed.mockResolvedValue({ ok: false, reason: "not_authorized" })
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { platform_role: null }, error: null }),
            }),
          }),
        }
      }
      return registrationChain({
        id: REG_ID,
        user_id: USER_ID,
        status: "confirmed",
      })
    })

    const { POST } = await import("../route")
    const res = await POST(
      new NextRequest("http://localhost/api/checkin/scan", {
        method: "POST",
        body: JSON.stringify({ token: buildToken(), eventId: EVENT_ID }),
      }),
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe("not_authorized")
  })

  it("marks confirmed registrations as checked in", async () => {
    const regChain = registrationChain({
      id: REG_ID,
      user_id: USER_ID,
      status: "confirmed",
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { platform_role: "staff_admin", display_name: "Staff" },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "event_registrations") return regChain
      return registrationChain({ id: REG_ID, user_id: USER_ID, status: "confirmed" })
    })

    const { POST } = await import("../route")
    const res = await POST(
      new NextRequest("http://localhost/api/checkin/scan", {
        method: "POST",
        body: JSON.stringify({ token: buildToken(), eventId: EVENT_ID }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.status).toBe("checked_in")
  })

  it("returns already_checked_in without failing", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { platform_role: "staff_admin", display_name: "Staff" },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "event_registrations") {
        return registrationChain({
          id: REG_ID,
          user_id: USER_ID,
          status: "checked_in",
          checked_in_at: "2026-06-01T12:00:00.000Z",
        })
      }
      return registrationChain({ id: REG_ID, user_id: USER_ID, status: "checked_in" })
    })

    const { POST } = await import("../route")
    const res = await POST(
      new NextRequest("http://localhost/api/checkin/scan", {
        method: "POST",
        body: JSON.stringify({ token: buildToken(), eventId: EVENT_ID }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.status).toBe("already_checked_in")
  })
})
