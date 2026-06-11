import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import { processMyVibesInAppReminders } from "@/lib/notifications/my-vibes-reminders"
import { logError } from "@/lib/log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

/** Hourly cron: in-app My Vibes reminders for saved upcoming events (#156). */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 })
  }

  try {
    const admin = createServiceRoleClient()
    const inApp = await processMyVibesInAppReminders(admin)
    return NextResponse.json({ ok: true, inApp })
  } catch (err) {
    logError("cron.event_reminders", err)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
