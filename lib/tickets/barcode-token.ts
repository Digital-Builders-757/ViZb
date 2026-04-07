import { createHmac } from "node:crypto"

const VERSION = 1
const PREFIX = "vizb.t"

/**
 * Compact signed payload for wallet QR / PDF417 barcodes.
 * Contains only registration + event ids (no PII). Verified server-side at check-in later.
 */
export function buildTicketBarcodeMessage(
  registrationId: string,
  eventId: string,
  secret: string,
): string {
  const body = JSON.stringify({ v: VERSION, r: registrationId, e: eventId })
  const mac = createHmac("sha256", secret).update(body).digest()
  const b64 = (buf: Buffer) => buf.toString("base64url")
  return `${PREFIX}.${VERSION}.${b64(Buffer.from(body, "utf8"))}.${b64(mac)}`
}

export function isTicketBarcodeSecretConfigured(): boolean {
  return Boolean(process.env.TICKET_BARCODE_HMAC_SECRET?.trim())
}

export function getTicketBarcodeSecret(): string | null {
  const s = process.env.TICKET_BARCODE_HMAC_SECRET?.trim()
  return s || null
}
