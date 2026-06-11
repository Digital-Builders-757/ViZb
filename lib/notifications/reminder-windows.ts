/** Reminder window identifiers for saved/ticketed events. */

export type ReminderWindow = "24h" | "2h"

export const REMINDER_WINDOWS: ReminderWindow[] = ["24h", "2h"]

const MS_HOUR = 60 * 60 * 1000

/** Target hours before start for each window (center of matching band). */
export const REMINDER_WINDOW_HOURS: Record<ReminderWindow, number> = {
  "24h": 24,
  "2h": 2,
}

/** Half-width of the matching band in hours (cron runs hourly). */
export const REMINDER_WINDOW_TOLERANCE_HOURS = 1

export function buildReminderDedupKey(
  source: "saved" | "ticket",
  window: ReminderWindow,
  eventId: string,
): string {
  return `${source}:${window}:${eventId}`
}

/** True when event start is within the reminder band for `window` at `nowMs`. */
export function eventStartInReminderWindow(
  startsAtIso: string,
  window: ReminderWindow,
  nowMs: number,
): boolean {
  const startMs = new Date(startsAtIso).getTime()
  const targetMs = nowMs + REMINDER_WINDOW_HOURS[window] * MS_HOUR
  const toleranceMs = REMINDER_WINDOW_TOLERANCE_HOURS * MS_HOUR
  return startMs >= targetMs - toleranceMs && startMs <= targetMs + toleranceMs
}

export function formatReminderLeadCopy(window: ReminderWindow): string {
  return window === "24h" ? "tomorrow" : "in about 2 hours"
}
