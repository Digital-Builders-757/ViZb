import { buildPublishedEventIcs } from "@/lib/calendar/build-ics"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const SELECT =
  "id, title, slug, description, starts_at, ends_at, venue_name, city, status"

async function resolveSiteOrigin(req: NextRequest): Promise<string> {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (envBase) return envBase
  const forwardedProto = req.headers.get("x-forwarded-proto")
  const forwardedHost = req.headers.get("x-forwarded-host")
  const host = forwardedHost ?? req.headers.get("host") ?? ""
  if (!host) return ""
  const proto = forwardedProto ?? (host.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim()
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  }

  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: "Calendar unavailable" }, { status: 503 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .order("starts_at", { ascending: true })
    .limit(1)

  const row = data?.[0]
  if (error || !row) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const base = await resolveSiteOrigin(req)
  const eventUrl = base ? `${base}/events/${row.slug}` : `/events/${row.slug}`

  const body = buildPublishedEventIcs({
    eventId: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venueName: row.venue_name,
    city: row.city,
    eventUrl,
  })

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vizb-event.ics"',
      "Cache-Control": "private, max-age=60",
    },
  })
}
