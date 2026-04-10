export type WalletEvent = {
  title: string
  slug: string
  starts_at: string
  ends_at?: string | null
  city: string
  venue_name: string
  flyer_url: string | null
}

/** PostgREST often returns embedded many-to-one rows as T or T[]. */
export function coalesceRelation<T>(raw: T | T[] | null | undefined): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

export function firstWalletEvent(raw: WalletEvent | WalletEvent[] | null | undefined): WalletEvent | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw === "object" && "slug" in raw) return raw
  return null
}

/** Door QR window: same as dashboard tickets list (late check-in). */
export const TICKET_QR_EVENT_WINDOW_AFTER_START_MS = 48 * 60 * 60 * 1000

export function ticketQrEligibleFromRegistration(args: {
  registrationStatus: string
  eventStartsAtIso: string
  nowMs: number
}): boolean {
  if (args.registrationStatus !== "confirmed" && args.registrationStatus !== "checked_in") return false
  const t = new Date(args.eventStartsAtIso).getTime()
  if (Number.isNaN(t)) return true
  if (t >= args.nowMs) return true
  return args.nowMs - t <= TICKET_QR_EVENT_WINDOW_AFTER_START_MS
}

export function partitionWalletRowsByStart<T extends { eventStartMs: number | null }>(rows: T[], nowMs: number) {
  const upcoming: T[] = []
  const past: T[] = []
  const undated: T[] = []

  for (const r of rows) {
    if (r.eventStartMs == null) {
      undated.push(r)
      continue
    }
    if (r.eventStartMs >= nowMs) upcoming.push(r)
    else past.push(r)
  }

  return { upcoming, past, undated }
}

export type RegistrationNested = {
  id: string
  status: string
  created_at: string
  checked_in_at: string | null
  event: WalletEvent | WalletEvent[] | null
}

export type TicketWalletRow = {
  id: string
  ticket_code: string
  event_id: string
  event_registration_id: string
  event_registrations: RegistrationNested
}

export type TicketWalletRowRaw = Omit<TicketWalletRow, "event_registrations"> & {
  event_registrations: RegistrationNested | RegistrationNested[]
}

export function normalizeTicketWalletRow(row: TicketWalletRowRaw): TicketWalletRow | null {
  const er = coalesceRelation(row.event_registrations)
  if (!er) return null
  return { ...row, event_registrations: er }
}
