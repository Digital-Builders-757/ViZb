import { createClient } from "@/lib/supabase/server"
import { buildTicketBarcodeMessage } from "@/lib/tickets/barcode-token"
import { getBarcodeSecretOrThrow, getGoogleWalletConfig, isGoogleWalletPassConfigured } from "@/lib/wallet/env"
import { fetchRegistrationForWalletPass } from "@/lib/wallet/fetch-registration-for-pass"
import { buildGoogleWalletSaveUrl } from "@/lib/wallet/google-save-jwt"
import { resolveSiteOriginFromRequest } from "@/lib/wallet/request-origin"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  if (!isGoogleWalletPassConfigured()) {
    return NextResponse.json({ error: "Wallet passes are not configured on this server." }, { status: 503 })
  }

  const rid = req.nextUrl.searchParams.get("rid")?.trim()
  if (!rid) {
    return NextResponse.json({ error: "Missing registration id." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const row = await fetchRegistrationForWalletPass(supabase, rid)
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (row.status === "cancelled") {
    return NextResponse.json({ error: "Registration is cancelled." }, { status: 403 })
  }

  try {
    const wallet = getGoogleWalletConfig()
    const secret = getBarcodeSecretOrThrow()
    const barcode = buildTicketBarcodeMessage(row.id, row.event_id, secret)
    const siteOrigin = resolveSiteOriginFromRequest(req)
    const objectSuffix = `reg_${row.id.replace(/-/g, "")}`

    const saveUrl = buildGoogleWalletSaveUrl({
      clientEmail: wallet.clientEmail,
      privateKeyPem: wallet.privateKeyPem,
      issuerId: wallet.issuerId,
      classId: wallet.classId,
      objectSuffix,
      siteOrigin,
      eventTitle: row.event.title,
      venueName: row.event.venue_name,
      city: row.event.city,
      startsAtIso: row.event.starts_at,
      barcodeMessage: barcode,
    })

    const wantsJson = req.nextUrl.searchParams.get("format") === "json"

    if (wantsJson) {
      const jwt = saveUrl.replace("https://pay.google.com/gp/v/save/", "")
      return NextResponse.json(
        { saveUrl, jwt },
        { status: 200, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
      )
    }

    return NextResponse.redirect(saveUrl, 302)
  } catch (err) {
    console.error("Google Wallet JWT error:", err)
    return NextResponse.json({ error: "Pass link generation failed." }, { status: 500 })
  }
}
