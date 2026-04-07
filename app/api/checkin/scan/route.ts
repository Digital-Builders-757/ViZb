import { assertCheckInScanAllowed } from "@/lib/checkin-scan-permissions"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { getTicketQrSecret, verifyTicketQrToken } from "@/lib/ticket-qr-token"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  token: z.string().min(12),
  eventId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 })
  }

  const secret = getTicketQrSecret()
  if (!secret) {
    return NextResponse.json({ error: "ticket_signing_not_configured" }, { status: 503 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const verified = verifyTicketQrToken(parsed.data.token, secret)
  if ("error" in verified) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 })
  }

  const { eid, rid } = verified.payload

  if (eid !== parsed.data.eventId) {
    return NextResponse.json(
      { result: "wrong_event", error: "This ticket is for a different event." },
      { status: 409 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle()

  const gate = await assertCheckInScanAllowed(supabase, user.id, profile?.platform_role, parsed.data.eventId)

  if (!gate.ok) {
    const status = gate.reason === "event_not_found" ? 404 : 403
    return NextResponse.json({ result: "not_authorized", error: gate.reason }, { status })
  }

  const { data: reg, error: regError } = await supabase
    .from("event_registrations")
    .select("id, user_id, status, checked_in_at")
    .eq("id", rid)
    .eq("event_id", eid)
    .maybeSingle()

  if (regError || !reg) {
    return NextResponse.json(
      { result: "registration_not_found", error: "Invalid or expired ticket." },
      { status: 404 },
    )
  }

  const { data: attendeeProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", reg.user_id)
    .maybeSingle()

  const attendee = {
    userId: reg.user_id,
    displayName: attendeeProfile?.display_name ?? null,
  }

  if (reg.status === "cancelled") {
    return NextResponse.json(
      { result: "cancelled", attendee, error: "This RSVP was cancelled." },
      { status: 409 },
    )
  }

  if (reg.status === "checked_in") {
    return NextResponse.json({
      result: "already_checked_in",
      attendee,
      checkedInAt: reg.checked_in_at,
    })
  }

  if (reg.status !== "confirmed") {
    return NextResponse.json({ result: "invalid_status", attendee }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { data: updated, error: upErr } = await supabase
    .from("event_registrations")
    .update({ status: "checked_in", checked_in_at: now, updated_at: now })
    .eq("id", reg.id)
    .eq("event_id", parsed.data.eventId)
    .eq("status", "confirmed")
    .select("id, checked_in_at")
    .maybeSingle()

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  if (!updated) {
    const { data: again } = await supabase
      .from("event_registrations")
      .select("status, checked_in_at")
      .eq("id", reg.id)
      .maybeSingle()

    if (again?.status === "checked_in") {
      return NextResponse.json({
        result: "already_checked_in",
        attendee,
        checkedInAt: again.checked_in_at,
      })
    }

    return NextResponse.json(
      { result: "check_in_failed", error: "Could not complete check-in." },
      { status: 409 },
    )
  }

  return NextResponse.json({
    result: "checked_in",
    attendee,
    checkedInAt: updated.checked_in_at,
  })
}
