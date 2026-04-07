import { createClient } from "@/lib/supabase/server"
import { isAppleWalletPassConfigured } from "@/lib/tickets/pass-config"
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

  return NextResponse.json(
    { ok: true, message: "apple pass not yet generated" },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
      },
    },
  )
}
