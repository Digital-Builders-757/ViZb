import { NextResponse } from "next/server"
import { runTicketmasterImport } from "@/lib/imports/run-ticketmaster-import"
import { logError } from "@/lib/log"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import { isTicketmasterImportEnabled } from "@/lib/ticketmaster/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

/** Every 6 hours: pull Ticketmaster Discovery events into pending review queue (#267). */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isTicketmasterImportEnabled()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "disabled" })
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 })
  }

  try {
    const admin = createServiceRoleClient()
    const summary = await runTicketmasterImport(admin, { trigger: "cron" })
    return NextResponse.json({
      ok: summary.ok,
      skipped: summary.skipped ?? false,
      reason: summary.reason,
      runId: summary.runId,
      sourceKey: summary.sourceKey,
      found: summary.found,
      created: summary.created,
      updated: summary.updated,
      skippedRecords: summary.skippedRecords,
      errors: summary.errors,
    })
  } catch (err) {
    logError("cron.ticketmaster_import", err)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
