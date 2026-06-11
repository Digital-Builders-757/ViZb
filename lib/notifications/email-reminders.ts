import type { SupabaseClient } from "@supabase/supabase-js"
import { logError, logWarn } from "@/lib/log"
import { sendEventReminderEmail } from "@/lib/email/event-reminder-mailer"
import { getPublicSiteOrigin } from "@/lib/public-site-url"
import {
  buildReminderDedupKey,
  eventStartInReminderWindow,
  formatReminderLeadCopy,
  REMINDER_WINDOWS,
  type ReminderWindow,
} from "@/lib/notifications/reminder-windows"

type ReminderEventRow = {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  status: string
}

const EMAIL_DEDUP_PREFIX = "email"

function emailDedupKey(source: "saved" | "ticket", window: ReminderWindow, eventId: string): string {
  return `${EMAIL_DEDUP_PREFIX}:${buildReminderDedupKey(source, window, eventId)}`
}

async function loadEmailOptIn(admin: SupabaseClient, userIds: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>()
  if (userIds.length === 0) return map

  const { data, error } = await admin
    .from("member_preferences")
    .select("user_id, reminder_opt_in, email_reminders")
    .in("user_id", userIds)

  if (error) {
    logError("email.reminders", error, { op: "load_prefs" })
    for (const id of userIds) map.set(id, true)
    return map
  }

  const byUser = new Map(
    (data ?? []).map((row) => [
      row.user_id as string,
      Boolean(row.reminder_opt_in) && Boolean(row.email_reminders),
    ]),
  )

  for (const id of userIds) {
    map.set(id, byUser.get(id) ?? true)
  }
  return map
}

async function alreadyEmailed(admin: SupabaseClient, userId: string, dedupKey: string): Promise<boolean> {
  const { data, error } = await admin
    .from("user_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("dedup_key", dedupKey)
    .maybeSingle()

  if (error) {
    logError("email.reminders", error, { op: "dedup_check" })
    return true
  }
  return Boolean(data)
}

async function recordEmailSent(
  admin: SupabaseClient,
  userId: string,
  dedupKey: string,
  title: string,
): Promise<void> {
  await admin.from("user_notifications").insert({
    user_id: userId,
    title: `[Email] ${title}`,
    body: "Event reminder email sent.",
    href: "/profile#culture-preferences",
    dedup_key: dedupKey,
    read_at: new Date().toISOString(),
  })
}

export type EmailReminderResult = {
  attempted: number
  sent: number
  skipped: number
}

/** Service-role: send email reminders for saved/ticketed events (uses dedup log). */
export async function processEventEmailReminders(
  admin: SupabaseClient,
  nowMs = Date.now(),
): Promise<EmailReminderResult> {
  const result: EmailReminderResult = { attempted: 0, sent: 0, skipped: 0 }
  const origin = getPublicSiteOrigin()

  const { data: profiles, error: profilesErr } = await admin
    .from("profiles")
    .select("id, email")
    .not("email", "is", null)

  if (profilesErr) {
    logError("email.reminders", profilesErr, { op: "load_profiles" })
    return result
  }

  const emailByUser = new Map(
    (profiles ?? [])
      .filter((p) => typeof p.email === "string" && p.email.includes("@"))
      .map((p) => [p.id as string, p.email as string]),
  )

  const { data: saves } = await admin
    .from("event_saves")
    .select("user_id, event_id, events!inner ( id, title, slug, starts_at, ends_at, venue_name, city, status )")

  const { data: tickets } = await admin
    .from("tickets")
    .select(
      "user_id, event_id, events!inner ( id, title, slug, starts_at, ends_at, venue_name, city, status ), event_registrations!inner ( status )",
    )
    .in("event_registrations.status", ["confirmed", "checked_in"])

  type Candidate = {
    userId: string
    ev: ReminderEventRow
    source: "saved" | "ticket"
    window: ReminderWindow
  }

  const candidates: Candidate[] = []

  function pushCandidate(userId: string, raw: unknown, source: "saved" | "ticket") {
    const ev = Array.isArray(raw) ? raw[0] : raw
    if (!ev || typeof ev !== "object") return
    const row = ev as ReminderEventRow
    if (row.status !== "published") return
    for (const window of REMINDER_WINDOWS) {
      if (eventStartInReminderWindow(row.starts_at, window, nowMs)) {
        candidates.push({ userId, ev: row, source, window })
      }
    }
  }

  for (const row of saves ?? []) {
    pushCandidate(row.user_id as string, (row as { events: unknown }).events, "saved")
  }
  for (const row of tickets ?? []) {
    pushCandidate(row.user_id as string, (row as { events: unknown }).events, "ticket")
  }

  const userIds = [...new Set(candidates.map((c) => c.userId))]
  const optIn = await loadEmailOptIn(admin, userIds)

  for (const c of candidates) {
    if (!optIn.get(c.userId)) {
      result.skipped += 1
      continue
    }
    const to = emailByUser.get(c.userId)
    if (!to) {
      result.skipped += 1
      continue
    }

    const dedupKey = emailDedupKey(c.source, c.window, c.ev.id)
    if (await alreadyEmailed(admin, c.userId, dedupKey)) {
      result.skipped += 1
      continue
    }

    result.attempted += 1
    const windowLabel = formatReminderLeadCopy(c.window)
    const ticketHref =
      c.source === "ticket" && origin ? `${origin}/dashboard/tickets` : null

    const sendResult = await sendEventReminderEmail({
      to,
      eventTitle: c.ev.title,
      eventSlug: c.ev.slug,
      startsAt: c.ev.starts_at,
      endsAt: c.ev.ends_at,
      venueName: c.ev.venue_name,
      city: c.ev.city,
      ticketHref,
      source: c.source,
      windowLabel,
    })

    if (sendResult.ok) {
      result.sent += 1
      await recordEmailSent(admin, c.userId, dedupKey, c.ev.title)
    } else {
      result.skipped += 1
    }
  }

  logWarn("email.reminders", "complete", result)
  return result
}
