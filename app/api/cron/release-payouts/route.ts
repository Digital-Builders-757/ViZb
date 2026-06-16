import { NextResponse } from "next/server"

import { releaseOrganizerPayouts } from "@/lib/payments/release-organizer-payouts"
import { logError } from "@/lib/log"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

/** Hourly cron: release organizer Connect payouts after event end + delay. */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 })
  }

  try {
    const admin = createServiceRoleClient()
    const result = await releaseOrganizerPayouts(admin)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    logError("cron.release_payouts", err)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
