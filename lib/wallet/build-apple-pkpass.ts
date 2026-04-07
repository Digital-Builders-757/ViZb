import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PKPass, type Barcode } from "passkit-generator"
import { buildTicketBarcodeMessage } from "@/lib/tickets/barcode-token"
import { getApplePassStaticIds, getBarcodeSecretOrThrow, loadAppleSignerMaterial } from "@/lib/wallet/env"

const assetsDir = join(process.cwd(), "lib/wallet/assets")

export function buildRsvpAppleWalletPkPass(input: {
  registrationId: string
  eventId: string
  title: string
  venueName: string
  city: string
  startsAtIso: string
}): Buffer {
  const certs = loadAppleSignerMaterial()
  const ids = getApplePassStaticIds()
  const orgName = process.env.APPLE_WALLET_ORG_NAME?.trim() || "ViZb"
  const secret = getBarcodeSecretOrThrow()
  const barcode = buildTicketBarcodeMessage(input.registrationId, input.eventId, secret)

  const venueLine = [input.venueName, input.city].filter(Boolean).join(" · ")
  const start = new Date(input.startsAtIso)
  const dateStr = Number.isNaN(start.getTime())
    ? "TBA"
    : start.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: ids.passTypeIdentifier,
    teamIdentifier: ids.teamIdentifier,
    serialNumber: input.registrationId,
    organizationName: orgName,
    description: `${input.title} — ${orgName}`,
    foregroundColor: "rgb(215, 245, 255)",
    backgroundColor: "rgb(6, 22, 40)",
    labelColor: "rgb(140, 210, 235)",
    eventTicket: {
      primaryFields: [{ key: "title", label: "EVENT", value: input.title }],
      secondaryFields: venueLine ? [{ key: "where", label: "VENUE", value: venueLine }] : [],
      auxiliaryFields: [{ key: "when", label: "DATE", value: dateStr }],
      backFields: [
        {
          key: "blurb",
          label: orgName,
          value: "Show this pass at check-in. RSVP is issued to your account.",
        },
      ],
    },
  }

  const icon = readFileSync(join(assetsDir, "icon.png"))
  const icon2 = readFileSync(join(assetsDir, "icon@2x.png"))
  const logo = readFileSync(join(assetsDir, "logo.png"))
  const logo2 = readFileSync(join(assetsDir, "logo@2x.png"))

  const pass = new PKPass(
    {
      "pass.json": Buffer.from(JSON.stringify(passJson), "utf8"),
      "icon.png": icon,
      "icon@2x.png": icon2,
      "logo.png": logo,
      "logo@2x.png": logo2,
    },
    {
      wwdr: certs.wwdrPem,
      signerCert: certs.signerCertPem,
      signerKey: certs.signerKeyPem,
      signerKeyPassphrase: certs.signerKeyPassphrase,
    },
    {
      serialNumber: input.registrationId,
    },
  )

  /** Explicit QR barcode (library also accepts a string and expands to all formats). */
  const qrBarcode: Barcode = {
    format: "PKBarcodeFormatQR",
    message: barcode,
    messageEncoding: "iso-8859-1",
    altText: "Check-in",
  }
  pass.setBarcodes(qrBarcode)
  const relevant = new Date(input.startsAtIso)
  if (!Number.isNaN(relevant.getTime())) {
    pass.setRelevantDate(relevant)
  }

  return pass.getAsBuffer()
}
