import { describe, expect, it } from "vitest"
import {
  buildTicketQrToken,
  TICKET_QR_MAX_EXP_SKEW_SECONDS,
  TICKET_QR_TTL_SECONDS,
  verifyTicketQrToken,
} from "../ticket-qr-token"

describe("ticket-qr-token", () => {
  const secret = "test-ticket-secret-32chars!"

  it("round-trips a valid token", () => {
    const now = 1_700_000_000
    const payload = {
      v: 1 as const,
      eid: "22222222-2222-2222-2222-222222222222",
      rid: "11111111-1111-1111-1111-111111111111",
      exp: now + 3600,
    }
    const token = buildTicketQrToken(payload, secret)
    const res = verifyTicketQrToken(token, secret, now)
    if ("error" in res) throw new Error(res.error)
    expect(res.payload).toEqual(payload)
  })

  it("rejects expired token", () => {
    const now = 1_700_000_000
    const token = buildTicketQrToken(
      {
        v: 1,
        eid: "22222222-2222-2222-2222-222222222222",
        rid: "11111111-1111-1111-1111-111111111111",
        exp: now - 1,
      },
      secret,
    )
    const res = verifyTicketQrToken(token, secret, now)
    expect(res).toEqual({ error: "Token expired" })
  })

  it("rejects expiry unreasonably far in the future", () => {
    const now = 1_700_000_000
    const payload = {
      v: 1 as const,
      eid: "22222222-2222-2222-2222-222222222222",
      rid: "11111111-1111-1111-1111-111111111111",
      exp: now + 60 * 60 * 24 * 400,
    }
    const token = buildTicketQrToken(payload, secret)
    const res = verifyTicketQrToken(token, secret, now)
    expect(res).toEqual({ error: "Expiry too far in future" })
  })

  it("allows expiry at the configured TTL horizon (plus skew)", () => {
    const now = 1_700_000_000
    const exp = now + TICKET_QR_TTL_SECONDS + TICKET_QR_MAX_EXP_SKEW_SECONDS
    const token = buildTicketQrToken(
      {
        v: 1,
        eid: "22222222-2222-2222-2222-222222222222",
        rid: "11111111-1111-1111-1111-111111111111",
        exp,
      },
      secret,
    )
    const res = verifyTicketQrToken(token, secret, now)
    if ("error" in res) throw new Error(res.error)
    expect(res.payload.exp).toBe(exp)
  })

  it("rejects expiry one second past the TTL horizon + skew", () => {
    const now = 1_700_000_000
    const exp = now + TICKET_QR_TTL_SECONDS + TICKET_QR_MAX_EXP_SKEW_SECONDS + 1
    const token = buildTicketQrToken(
      {
        v: 1,
        eid: "22222222-2222-2222-2222-222222222222",
        rid: "11111111-1111-1111-1111-111111111111",
        exp,
      },
      secret,
    )
    const res = verifyTicketQrToken(token, secret, now)
    expect(res).toEqual({ error: "Expiry too far in future" })
  })

  it("rejects tampering", () => {
    const now = 1_700_000_000
    const token = buildTicketQrToken(
      {
        v: 1,
        eid: "22222222-2222-2222-2222-222222222222",
        rid: "11111111-1111-1111-1111-111111111111",
        exp: now + 3600,
      },
      secret,
    )
    const [body, sig] = token.split(".")
    const tampered = `${body}x.${sig}`
    const res = verifyTicketQrToken(tampered, secret, now)
    expect(res).toEqual({ error: "Invalid signature" })
  })
})
