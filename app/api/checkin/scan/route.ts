import { assertCheckInScanAllowed } from "@/lib/checkin-scan-permissions"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { getTicketQrSecret, verifyTicketQrToken } from "@/lib/ticket-qr-token"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  token: z.string().min(12),
  eventId: z.string().uuid(),
})

export type CheckInScanAttendee = {
  registrationId: string
  userId: string
  displayName: string | null
}

type CheckInScanOk = {
  ok: true
  status: "checked_in" | "already_checked_in"
  attendee?: CheckInScanAttendee
  checkedInAt?: string | null
}

type CheckInScanErr = {
  ok: false
  error: string
  code: string
  /** Present when the registration row was found but cannot be checked in. */
  attendee?: CheckInScanAttendee
}

function scanResponse(body: CheckInScanOk | CheckInScanErr, status = 200) {
  const headers = new Headers()
  headers.set("Vary", "Cookie")
  headers.set("Cache-Control", "private, no-store, max-age=0")
  return NextResponse.json(body, { status, headers })
}

function verifyErrorToCode(msg: string): { code: string; error: string } {
  if (msg === "Token expired") return { code: "token_expired", error: "This ticket code has expired. Ask the guest to refresh My tickets." }
  if (msg === "Expiry too far in future")
    return { code: "token_expiry_invalid", error: "This ticket code is not valid." }
  return { code: "invalid_token", error: "This ticket code could not be verified." }
}

export async function POST(req: NextRequest) {
  if (!isServerSupabaseConfigured()) {
    return scanResponse({ ok: false, error: "Service unavailable.", code: "service_unavailable" }, 503)
  }

  const secret = getTicketQrSecret()
  if (!secret) {
    return scanResponse(
      { ok: false, error: "Scanner not configured (missing TICKET_QR_SECRET).", code: "scanner_not_configured" },
      503,
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return scanResponse({ ok: false, error: "Invalid JSON body.", code: "invalid_body" }, 400)
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return scanResponse({ ok: false, error: "Invalid request body.", code: "invalid_body" }, 400)
  }

  const verified = verifyTicketQrToken(parsed.data.token, secret)
  if ("error" in verified) {
    const { code, error } = verifyErrorToCode(verified.error)
    return scanResponse({ ok: false, error, code }, 400)
  }

  const { eid, rid } = verified.payload

  if (eid !== parsed.data.eventId) {
    return scanResponse(
      {
        ok: false,
        error: "This ticket is for a different event.",
        code: "wrong_event",
      },
      409,
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return scanResponse({ ok: false, error: "Sign in again, then retry.", code: "unauthorized" }, 401)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle()

  const gate = await assertCheckInScanAllowed(supabase, user.id, profile?.platform_role, parsed.data.eventId)

  if (!gate.ok) {
    const status = gate.reason === "event_not_found" ? 404 : 403
    return scanResponse(
      {
        ok: false,
        error:
          gate.reason === "event_not_found"
            ? "Event not found."
            : "You are not allowed to check in guests for this event.",
        code: gate.reason === "event_not_found" ? "event_not_found" : "not_authorized",
      },
      status,
    )
  }

  const { data: reg, error: regError } = await supabase
    .from("event_registrations")
    .select("id, user_id, status, checked_in_at")
    .eq("id", rid)
    .eq("event_id", eid)
    .maybeSingle()

  if (regError || !reg) {
    return scanResponse(
      {
        ok: false,
        error: "No matching registration for this ticket.",
        code: "registration_not_found",
      },
      404,
    )
  }

  const { data: attendeeProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", reg.user_id)
    .maybeSingle()

  const attendee: CheckInScanAttendee = {
    registrationId: reg.id,
    userId: reg.user_id,
    displayName: attendeeProfile?.display_name ?? null,
  }

  if (reg.status === "cancelled") {
    return scanResponse(
      {
        ok: false,
        error: "This RSVP was cancelled.",
        code: "registration_cancelled",
        attendee,
      },
      409,
    )
  }

  if (reg.status === "checked_in") {
    return scanResponse({
      ok: true,
      status: "already_checked_in",
      attendee,
      checkedInAt: reg.checked_in_at,
    })
  }

  if (reg.status !== "confirmed") {
    return scanResponse(
      {
        ok: false,
        error: "This registration is not confirmed.",
        code: "registration_invalid_status",
        attendee,
      },
      409,
    )
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
    return scanResponse({ ok: false, error: upErr.message, code: "server_error" }, 500)
  }

  if (!updated) {
    const { data: again } = await supabase
      .from("event_registrations")
      .select("status, checked_in_at")
      .eq("id", reg.id)
      .maybeSingle()

    if (again?.status === "checked_in") {
      return scanResponse({
        ok: true,
        status: "already_checked_in",
        attendee,
        checkedInAt: again.checked_in_at,
      })
    }

    return scanResponse(
      {
        ok: false,
        error: "Could not complete check-in.",
        code: "check_in_failed",
      },
      409,
    )
  }

  return scanResponse({
    ok: true,
    status: "checked_in",
    attendee,
    checkedInAt: updated.checked_in_at,
  })
}
