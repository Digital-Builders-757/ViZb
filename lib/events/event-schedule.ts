/** Effective end of an event: coalesce(ends_at, starts_at). */
export function getEventEffectiveEndMs(startsAt: string, endsAt: string | null): number {
  return endsAt ? new Date(endsAt).getTime() : new Date(startsAt).getTime()
}

/** Public upcoming/discovery: effectiveEnd > now. */
export function isEventUpcomingOrOngoing(
  startsAt: string,
  endsAt: string | null,
  nowMs = Date.now(),
): boolean {
  return getEventEffectiveEndMs(startsAt, endsAt) > nowMs
}

/** Event has ended: effectiveEnd <= now. */
export function isEventPast(startsAt: string, endsAt: string | null, nowMs = Date.now()): boolean {
  return getEventEffectiveEndMs(startsAt, endsAt) <= nowMs
}

export const EVENT_ENDED_MESSAGE = "This event has already ended."

export function assertEventAcceptsPublicRegistration(
  startsAt: string,
  endsAt: string | null,
  nowMs = Date.now(),
): { ok: true } | { ok: false; error: string } {
  if (isEventPast(startsAt, endsAt, nowMs)) {
    return { ok: false, error: EVENT_ENDED_MESSAGE }
  }
  return { ok: true }
}
