import type { SupabaseClient } from "@supabase/supabase-js"
import { logError, logWarn } from "@/lib/log"
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
  status: string
}

type SavedJoinRow = {
  user_id: string
  event_id: string
  events: ReminderEventRow | ReminderEventRow[] | null
}

type TicketJoinRow = {
  user_id: string
  event_id: string
  events: ReminderEventRow | ReminderEventRow[] | null
}

export type ReminderInsert = {
  user_id: string
  title: string
  body: string
  href: string
  dedup_key: string
}

function coalesceEvent(raw: ReminderEventRow | ReminderEventRow[] | null): ReminderEventRow | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function isEligibleEvent(ev: ReminderEventRow | null, window: ReminderWindow, nowMs: number): ev is ReminderEventRow {
  if (!ev || ev.status !== "published") return false
  return eventStartInReminderWindow(ev.starts_at, window, nowMs)
}

function buildNotification(
  userId: string,
  ev: ReminderEventRow,
  source: "saved" | "ticket",
  window: ReminderWindow,
): ReminderInsert {
  const lead = formatReminderLeadCopy(window)
  const dedup_key = buildReminderDedupKey(source, window, ev.id)
  const title = source === "saved" ? "My Vibes reminder" : "Ticket reminder"
  const body =
    source === "saved"
      ? `${ev.title} starts ${lead}. Open your saved event for details.`
      : `${ev.title} starts ${lead}. Open your ticket or event page.`
  const href = source === "ticket" ? `/dashboard/tickets` : `/events/${ev.slug}`

  return { user_id: userId, title, body, href, dedup_key }
}

async function loadInAppOptIn(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>()
  if (userIds.length === 0) return map

  const { data, error } = await admin
    .from("member_preferences")
    .select("user_id, reminder_opt_in, in_app_reminders")
    .in("user_id", userIds)

  if (error) {
    logError("notifications.reminders", error, { op: "load_prefs" })
    for (const id of userIds) map.set(id, true)
    return map
  }

  const byUser = new Map(
    (data ?? []).map((row) => [
      row.user_id as string,
      Boolean(row.reminder_opt_in) && Boolean(row.in_app_reminders),
    ]),
  )

  for (const id of userIds) {
    map.set(id, byUser.get(id) ?? true)
  }
  return map
}

async function insertIfNew(admin: SupabaseClient, row: ReminderInsert): Promise<boolean> {
  const { error } = await admin.from("user_notifications").insert(row)
  if (error) {
    if (error.code === "23505") return false
    logError("notifications.reminders", error, { op: "insert", dedup_key: row.dedup_key })
    return false
  }
  return true
}

export type MyVibesReminderResult = {
  scanned: number
  inserted: number
  skippedOptOut: number
}

/** Service-role: enqueue in-app reminders for saved + ticketed upcoming events. */
export async function processMyVibesInAppReminders(
  admin: SupabaseClient,
  nowMs = Date.now(),
): Promise<MyVibesReminderResult> {
  const result: MyVibesReminderResult = { scanned: 0, inserted: 0, skippedOptOut: 0 }

  const { data: saves, error: savesErr } = await admin
    .from("event_saves")
    .select("user_id, event_id, events!inner ( id, title, slug, starts_at, status )")

  if (savesErr) {
    logError("notifications.reminders", savesErr, { op: "load_saves" })
    return result
  }

  const pending: ReminderInsert[] = []
  const userIds = new Set<string>()

  for (const row of (saves ?? []) as SavedJoinRow[]) {
    const ev = coalesceEvent(row.events)
    for (const window of REMINDER_WINDOWS) {
      if (!isEligibleEvent(ev, window, nowMs)) continue
      result.scanned += 1
      userIds.add(row.user_id)
      pending.push(buildNotification(row.user_id, ev, "saved", window))
    }
  }

  const optIn = await loadInAppOptIn(admin, [...userIds])

  for (const row of pending) {
    if (!optIn.get(row.user_id)) {
      result.skippedOptOut += 1
      continue
    }
    const ok = await insertIfNew(admin, row)
    if (ok) result.inserted += 1
  }

  logWarn("notifications.reminders", "in_app_complete", result)
  return result
}
