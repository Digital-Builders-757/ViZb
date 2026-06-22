import { NextResponse } from "next/server"
import { requireStaffAdminApi } from "@/lib/auth/require-staff-admin-api"
import { getSourceHealth } from "@/lib/imports/source-readiness"
import { logError } from "@/lib/log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ sourceKey: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireStaffAdminApi()
  if (!auth.ok) return auth.response

  const { sourceKey } = await context.params

  try {
    const health = await getSourceHealth(sourceKey)
    if (!health) {
      return NextResponse.json({ error: "Unknown source." }, { status: 404 })
    }
    return NextResponse.json({ health })
  } catch (err) {
    logError("api.admin.imports.sources.health", err, { sourceKey })
    return NextResponse.json({ error: "Failed to load source health." }, { status: 500 })
  }
}
