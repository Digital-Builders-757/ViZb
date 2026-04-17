/** Lineup row status — keep in sync with DB enum `lineup_entry_status`. */

export const LINEUP_ENTRY_STATUS_VALUES = [
  "pending",
  "confirmed",
  "performed",
  "no_show",
  "cancelled",
] as const

export type LineupEntryStatus = (typeof LINEUP_ENTRY_STATUS_VALUES)[number]

export const PUBLIC_LINEUP_STATUSES: readonly LineupEntryStatus[] = ["confirmed", "performed"]

const LABELS: Record<LineupEntryStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  performed: "Performed",
  no_show: "No-show",
  cancelled: "Cancelled",
}

export function formatLineupStatusLabel(status: string): string {
  const key = status.toLowerCase() as LineupEntryStatus
  return LABELS[key] ?? status
}

export function isLineupEntryStatus(v: string): v is LineupEntryStatus {
  return (LINEUP_ENTRY_STATUS_VALUES as readonly string[]).includes(v)
}
