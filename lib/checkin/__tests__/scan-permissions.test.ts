import { describe, expect, it, vi } from "vitest"

import { assertCheckInScanAllowed } from "@/lib/checkin-scan-permissions"

const EVENT_ID = "11111111-1111-4111-8111-111111111111"
const ORG_ID = "22222222-2222-4222-8222-222222222222"
const USER_ID = "33333333-3333-4333-8333-333333333333"

function mockSupabase(opts: {
  event?: { id: string; org_id: string } | null
  eventError?: boolean
  membership?: { role: string } | null
}) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue(
                opts.eventError
                  ? { data: null, error: { message: "db" } }
                  : { data: opts.event ?? null, error: null },
              ),
            }),
          }),
        }
      }
      if (table === "organization_members") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: opts.membership ?? null,
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }
    }),
  }
}

describe("assertCheckInScanAllowed", () => {
  it("allows staff admins for any event", async () => {
    const supabase = mockSupabase({
      event: { id: EVENT_ID, org_id: ORG_ID },
    })
    const result = await assertCheckInScanAllowed(
      supabase as never,
      USER_ID,
      "staff_admin",
      EVENT_ID,
    )
    expect(result).toEqual({ ok: true })
  })

  it("allows org owners and admins", async () => {
    const supabase = mockSupabase({
      event: { id: EVENT_ID, org_id: ORG_ID },
      membership: { role: "admin" },
    })
    const result = await assertCheckInScanAllowed(
      supabase as never,
      USER_ID,
      null,
      EVENT_ID,
    )
    expect(result).toEqual({ ok: true })
  })

  it("rejects unauthorized members", async () => {
    const supabase = mockSupabase({
      event: { id: EVENT_ID, org_id: ORG_ID },
      membership: { role: "viewer" },
    })
    const result = await assertCheckInScanAllowed(
      supabase as never,
      USER_ID,
      null,
      EVENT_ID,
    )
    expect(result).toEqual({ ok: false, reason: "not_authorized" })
  })

  it("rejects when event is missing", async () => {
    const supabase = mockSupabase({ event: null })
    const result = await assertCheckInScanAllowed(
      supabase as never,
      USER_ID,
      "staff_admin",
      EVENT_ID,
    )
    expect(result).toEqual({ ok: false, reason: "event_not_found" })
  })
})
