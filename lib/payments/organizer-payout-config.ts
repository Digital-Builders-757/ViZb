const DEFAULT_PAYOUT_DELAY_HOURS = 48
const MIN_PAYOUT_DELAY_HOURS = 24
const MAX_PAYOUT_DELAY_HOURS = 72

function readPayoutDelayHoursFromEnv(): number {
  const raw = process.env.VIZB_PAYOUT_DELAY_HOURS?.trim()
  if (!raw) return DEFAULT_PAYOUT_DELAY_HOURS

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed)) return DEFAULT_PAYOUT_DELAY_HOURS

  return Math.min(MAX_PAYOUT_DELAY_HOURS, Math.max(MIN_PAYOUT_DELAY_HOURS, parsed))
}

export function getOrganizerPayoutDelayHours(): number {
  return readPayoutDelayHoursFromEnv()
}

export function computeOrganizerPayoutAvailableOn(eventEndsAt: string | null, eventStartsAt: string): Date {
  const base = eventEndsAt ? new Date(eventEndsAt) : new Date(eventStartsAt)
  if (Number.isNaN(base.getTime())) {
    throw new Error("Event schedule is invalid for payout scheduling.")
  }

  const delayMs = getOrganizerPayoutDelayHours() * 60 * 60 * 1000
  return new Date(base.getTime() + delayMs)
}
