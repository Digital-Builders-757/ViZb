import { describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"

import { handleAccountUpdated } from "@/lib/stripe/connect/webhook-account-updated"

describe("handleAccountUpdated", () => {
  it("syncs organizer row when stripe account is known", async () => {
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "row-1",
            organizer_id: "user-1",
            stripe_account_id: "acct_123",
            charges_enabled: true,
            payouts_enabled: true,
            details_submitted: true,
            onboarding_status: "active",
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
          error: null,
        }),
      }),
    })

    const admin = {
      from: vi.fn((table: string) => {
        if (table === "organizer_stripe_accounts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { organizer_id: "user-1" },
                  error: null,
                }),
              }),
            }),
            upsert,
          }
        }
        return {}
      }),
    }

    const result = await handleAccountUpdated(admin as never, {
      id: "acct_123",
      object: "account",
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      metadata: { organizer_id: "user-1" },
    } as unknown as Stripe.Account)

    expect(result.organizerId).toBe("user-1")
    expect(upsert).toHaveBeenCalled()
  })
})
