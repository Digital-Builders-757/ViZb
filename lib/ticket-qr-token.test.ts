import { describe, expect, it } from "vitest"
import { buildTicketQrToken, verifyTicketQrToken } from "./ticket-qr-token"

describe("ticket-qr-token", () => {
  it("round-trips a valid token", () => {
    const secret = "test-secret"
    const now = 1_700_000_000

    const token = buildTicketQrToken(
      { v: 1, eid: "event-uuid", rid: "reg-uuid", exp: now + 3600 },
      secret,
    )

    const res = verifyTicketQrToken(token, secret, now)
    if ("error" in res) throw new Error(res.error)

    expect(res.payload.v).toBe(1)
    expect(res.payload.eid).toBe("event-uuid")
    expect(res.payload.rid).toBe("reg-uuid")
  })

  it("rejects expired token", () => {
    const secret = "test-secret"
    const now = 1_700_000_000

    const token = buildTicketQrToken(
      { v: 1, eid: "event-uuid", rid: "reg-uuid", exp: now - 1 },
      secret,
    )

    const res = verifyTicketQrToken(token, secret, now)
    expect(res).toEqual({ error: "Token expired" })
  })

  it("rejects tampering", () => {
    const secret = "test-secret"
    const now = 1_700_000_000

    const token = buildTicketQrToken(
      { v: 1, eid: "event-uuid", rid: "reg-uuid", exp: now + 3600 },
      secret,
    )

    const [body, sig] = token.split(".")
    const tampered = `${body}x.${sig}`

    const res = verifyTicketQrToken(tampered, secret, now)
    expect(res).toEqual({ error: "Invalid signature" })
  })
})
