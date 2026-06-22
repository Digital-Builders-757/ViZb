import { NextResponse } from "next/server"
import { requireStaffAdminApi } from "@/lib/auth/require-staff-admin-api"
import { runEventbriteImport } from "@/lib/imports/run-eventbrite-import"
import { logError } from "@/lib/log"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  const auth = await requireStaffAdminApi()
  if (!auth.ok) return auth.response

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured." }, { status: 503 })
  }

  try {
    const admin = createServiceRoleClient()
    const summary = await runEventbriteImport(admin, {
      trigger: "manual",
      triggeredBy: auth.userId,
    })

    return NextResponse.json({
      ok: summary.ok,
      skipped: summary.skipped ?? false,
      reason: summary.reason,
      runId: summary.runId,
      sourceKey: summary.sourceKey,
      found: summary.found,
      created: summary.created,
      updated: summary.updated,
      skippedEvents: summary.skippedRecords,
      skippedRecords: summary.skippedRecords,
      errors: summary.errors,
    })
  } catch (err) {
    logError("api.admin.eventbrite.run", err)
    return NextResponse.json({ error: "Import failed." }, { status: 500 })
  }
}
