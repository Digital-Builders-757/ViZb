import { createSign } from "node:crypto"

function base64urlJson(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url")
}

/**
 * Signs the compact-serialized JWT header + payload per RS256 (Google "Save to Google Wallet" JWT).
 */
export function signGoogleSaveToWalletJwt(claims: Record<string, unknown>, privateKeyPem: string): string {
  const header = { alg: "RS256", typ: "JWT" }
  const signingInput = `${base64urlJson(header)}.${base64urlJson(claims)}`
  const sign = createSign("RSA-SHA256")
  sign.update(signingInput)
  const sig = sign.sign(privateKeyPem)
  const sigPart = Buffer.from(sig).toString("base64url")
  return `${signingInput}.${sigPart}`
}

export function buildGoogleWalletSaveUrl(params: {
  clientEmail: string
  privateKeyPem: string
  issuerId: string
  classId: string
  /** Stable wallet object id suffix (alphanumeric, underscores, hyphens). */
  objectSuffix: string
  siteOrigin: string
  eventTitle: string
  venueName: string
  city: string
  startsAtIso: string | null
  barcodeMessage: string
}): string {
  const iat = Math.floor(Date.now() / 1000)
  const venueLine = [params.venueName, params.city].filter(Boolean).join(" · ")

  const object: Record<string, unknown> = {
    id: `${params.issuerId}.${params.objectSuffix}`,
    classId: params.classId,
    state: "ACTIVE",
    eventName: {
      defaultValue: { language: "en-US", value: params.eventTitle },
    },
    barcode: {
      type: "QR_CODE",
      value: params.barcodeMessage,
      alternateText: "Check-in",
    },
  }

  if (venueLine) {
    object.venueName = {
      defaultValue: { language: "en-US", value: venueLine },
    }
  }

  if (params.startsAtIso) {
    object.dateTime = { start: params.startsAtIso }
  }

  const jwt = signGoogleSaveToWalletJwt(
    {
      iss: params.clientEmail,
      aud: "google",
      typ: "savetowallet",
      iat,
      origins: params.siteOrigin ? [params.siteOrigin] : [],
      payload: {
        eventTicketObjects: [object],
      },
    },
    params.privateKeyPem,
  )

  return `https://pay.google.com/gp/v/save/${jwt}`
}
