import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { logError } from "@/lib/log"
import { NextRequest, NextResponse } from "next/server"

/**
 * One lightweight beacon per browser navigation to the public event detail page.
 * Counts only while the event is published (enforced in RPC).
 */
export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const { slug } = await context.params
  const trimmed = slug?.trim()
  if (!trimmed) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc("increment_event_public_detail_views", { p_slug: trimmed })
    if (error) {
      logError("events.view_beacon", error, { slug: trimmed })
      return NextResponse.json({ ok: false }, { status: 503 })
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
