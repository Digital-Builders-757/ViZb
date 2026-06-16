import { NextResponse } from "next/server"
import { isEventbriteImportEnabled } from "@/lib/eventbrite/env"
import { runEventbriteImport } from "@/lib/imports/run-eventbrite-import"
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

/** Every 6 hours: pull Eventbrite org events into pending review queue (#259). */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isEventbriteImportEnabled()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "disabled" })
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 })
  }

  try {
    const admin = createServiceRoleClient()
    const summary = await runEventbriteImport(admin, { trigger: "cron" })
    return NextResponse.json({
      ok: summary.ok,
      skipped: summary.skipped ?? false,
      reason: summary.reason,
      runId: summary.runId,
      found: summary.found,
      created: summary.created,
      updated: summary.updated,
      skippedEvents: summary.skippedEvents,
      errors: summary.errors,
    })
  } catch (err) {
    logError("cron.eventbrite_import", err)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
