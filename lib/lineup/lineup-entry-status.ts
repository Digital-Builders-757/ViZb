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

/** Same slice as public `/lineup/[slug]` query and RLS `lineup_select_public_slice`. */
export function isLineupEntryOnPublicPage(row: {
  status: string
  is_public: boolean
}): boolean {
  if (!row.is_public) return false
  const st = row.status.toLowerCase()
  return (PUBLIC_LINEUP_STATUSES as readonly string[]).includes(st)
}

export type LineupPublicVisibilityTone = "on_public" | "muted" | "caution"

/** Organizer-facing copy: why a row does or does not appear on the public lineup page. */
export function getLineupEntryPublicVisibilityPresentation(row: {
  status: string
  is_public: boolean
}): { label: string; tone: LineupPublicVisibilityTone } {
  const status = row.status.toLowerCase()

  if (status === "cancelled") {
    return { label: "Cancelled — not on public lineup", tone: "muted" }
  }
  if (isLineupEntryOnPublicPage(row)) {
    return { label: "Visible on public lineup", tone: "on_public" }
  }
  if (!row.is_public) {
    return { label: "Public off", tone: "muted" }
  }
  if (status === "pending") {
    return { label: "Pending — not on public lineup yet", tone: "muted" }
  }
  if (status === "no_show") {
    return { label: "No-show — not on public lineup", tone: "caution" }
  }
  return { label: "Not on public lineup", tone: "muted" }
}
