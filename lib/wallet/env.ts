import { getTicketBarcodeSecret, isTicketBarcodeSecretConfigured } from "@/lib/tickets/barcode-token"
import {
  decodeBase64ToBuffer,
  decodeBase64ToUtf8,
  p12ToSignerCertificates,
  type AppleSignerMaterial,
} from "@/lib/wallet/apple-certificates"

function trimEnv(name: string): string {
  return process.env[name]?.trim() ?? ""
}

export function isAppleWalletPassConfigured(): boolean {
  if (!isTicketBarcodeSecretConfigured()) return false
  if (!trimEnv("APPLE_WALLET_TEAM_ID")) return false
  if (!trimEnv("APPLE_WALLET_PASS_TYPE_ID")) return false
  if (!trimEnv("APPLE_WALLET_CERT_P12_BASE64")) return false
  if (!trimEnv("APPLE_WALLET_CERT_PASSWORD")) return false
  if (!trimEnv("APPLE_WALLET_WWDR_PEM_BASE64")) return false
  return true
}

export function isGoogleWalletPassConfigured(): boolean {
  if (!isTicketBarcodeSecretConfigured()) return false
  if (!trimEnv("GOOGLE_WALLET_ISSUER_ID")) return false
  if (!trimEnv("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64")) return false
  if (!trimEnv("GOOGLE_WALLET_CLASS_ID")) return false
  return true
}

export function loadAppleSignerMaterial(): AppleSignerMaterial {
  const p12B64 = trimEnv("APPLE_WALLET_CERT_P12_BASE64")
  const password = trimEnv("APPLE_WALLET_CERT_PASSWORD")
  const wwdrPem = decodeBase64ToUtf8(trimEnv("APPLE_WALLET_WWDR_PEM_BASE64"))
  const p12 = decodeBase64ToBuffer(p12B64)
  const { signerCertPem, signerKeyPem } = p12ToSignerCertificates(p12, password)
  return {
    wwdrPem,
    signerCertPem,
    signerKeyPem,
    signerKeyPassphrase: password,
  }
}

export function getApplePassStaticIds() {
  return {
    teamIdentifier: trimEnv("APPLE_WALLET_TEAM_ID"),
    passTypeIdentifier: trimEnv("APPLE_WALLET_PASS_TYPE_ID"),
  }
}

export function getGoogleWalletConfig() {
  const issuerId = trimEnv("GOOGLE_WALLET_ISSUER_ID")
  const classIdRaw = trimEnv("GOOGLE_WALLET_CLASS_ID")
  const classId = classIdRaw.includes(".") ? classIdRaw : `${issuerId}.${classIdRaw}`
  const saJson = JSON.parse(decodeBase64ToUtf8(trimEnv("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64"))) as {
    client_email?: string
    private_key?: string
  }
  if (!saJson.client_email || !saJson.private_key) {
    throw new Error("Invalid Google service account JSON (missing client_email or private_key)")
  }
  return {
    issuerId,
    classId,
    clientEmail: saJson.client_email,
    privateKeyPem: saJson.private_key,
  }
}

export function getBarcodeSecretOrThrow(): string {
  const s = getTicketBarcodeSecret()
  if (!s) {
    throw new Error("TICKET_BARCODE_HMAC_SECRET is not set")
  }
  return s
}
