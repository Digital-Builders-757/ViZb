import { createClient } from "@/lib/supabase/server"
import { buildRsvpAppleWalletPkPass } from "@/lib/wallet/build-apple-pkpass"
import { isAppleWalletPassConfigured } from "@/lib/wallet/env"
import { fetchRegistrationForWalletPass } from "@/lib/wallet/fetch-registration-for-pass"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  if (!isAppleWalletPassConfigured()) {
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
    const buf = buildRsvpAppleWalletPkPass({
      registrationId: row.id,
      eventId: row.event_id,
      title: row.event.title,
      venueName: row.event.venue_name,
      city: row.event.city,
      startsAtIso: row.event.starts_at,
    })

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="vizb-ticket.pkpass"',
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
      },
    })
  } catch (err) {
    console.error("Apple Wallet pkpass error:", err)
    return NextResponse.json({ error: "Pass generation failed." }, { status: 500 })
  }
}
