import { NextResponse } from "next/server"
import { requireStaffAdminApi } from "@/lib/auth/require-staff-admin-api"
import { listEventSourcesWithReadiness } from "@/lib/imports/source-readiness"
import { logError } from "@/lib/log"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireStaffAdminApi()
  if (!auth.ok) return auth.response

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured." }, { status: 503 })
  }

  try {
    const admin = createServiceRoleClient()
    const sources = await listEventSourcesWithReadiness(admin)
    return NextResponse.json({ sources })
  } catch (err) {
    logError("api.admin.imports.sources", err)
    return NextResponse.json({ error: "Failed to load sources." }, { status: 500 })
  }
}
