import { createHmac, timingSafeEqual } from "node:crypto"

/** Seconds from issue snapshot until ticket QR expires (member refreshes wallet for a new token). */
export const TICKET_QR_TTL_SECONDS = 60 * 60 * 24 * 365

export function getTicketQrSecret(): string | null {
  const s = process.env.TICKET_QR_SECRET?.trim()
  if (s && s.length >= 16) return s
  return null
}

/**
 * Signed token for ticket QR codes.
 *
 * Design goals:
 * - No PII in QR.
 * - Tamper-evident (HMAC).
 * - Short, URL-safe.
 * - Versioned for future migrations.
 */
export type TicketQrTokenPayloadV1 = {
  v: 1
  /** Event id (uuid). */
  eid: string
  /** Registration id (uuid). */
  rid: string
  /** Expiry unix seconds. */
  exp: number
}

export type TicketQrTokenVerified = {
  payload: TicketQrTokenPayloadV1
}

function b64urlEncode(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function b64urlDecodeToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = normalized.length % 4
  const padded = pad === 0 ? normalized : normalized + "=".repeat(4 - pad)
  return Buffer.from(padded, "base64")
}

function sign(data: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(data).digest()
  // 16 bytes is plenty for QR tokens; shorter payload.
  return b64urlEncode(mac.subarray(0, 16))
}

export function buildTicketQrToken(payload: TicketQrTokenPayloadV1, secret: string): string {
  const json = JSON.stringify(payload)
  const body = b64urlEncode(json)
  const sig = sign(body, secret)
  return `${body}.${sig}`
}

export function verifyTicketQrToken(token: string, secret: string, nowUnixSeconds = Math.floor(Date.now() / 1000)):
  | TicketQrTokenVerified
  | { error: string } {
  const raw = token.trim()
  const parts = raw.split(".")
  if (parts.length !== 2) return { error: "Invalid token format" }

  const [body, sig] = parts
  if (!body || !sig) return { error: "Invalid token format" }

  const expectedSig = sign(body, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: "Invalid signature" }

  let payload: unknown
  try {
    payload = JSON.parse(b64urlDecodeToBuffer(body).toString("utf8"))
  } catch {
    return { error: "Invalid payload" }
  }

  if (!payload || typeof payload !== "object") return { error: "Invalid payload" }
  const p = payload as Partial<TicketQrTokenPayloadV1>

  if (p.v !== 1) return { error: "Unsupported token version" }
  if (!p.eid || !p.rid) return { error: "Missing token fields" }
  if (!p.exp || typeof p.exp !== "number") return { error: "Missing expiry" }
  if (p.exp < nowUnixSeconds) return { error: "Token expired" }

  return { payload: p as TicketQrTokenPayloadV1 }
}
