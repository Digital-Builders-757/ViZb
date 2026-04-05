"use client"

import { DoorOpsRegistrationList } from "@/components/door-ops/door-ops-registration-list"
import { CheckInButton } from "@/components/admin/check-in-button"
import { UndoCheckInButton } from "@/components/admin/undo-check-in-button"

type Row = {
  user_id: string
  status: "confirmed" | "cancelled" | "checked_in" | string
  created_at: string
  checked_in_at?: string | null
}

export function AdminEventRegistrationsTable({
  eventId,
  rows,
  profileById,
}: {
  eventId: string
  rows: Row[]
  profileById: Record<string, { display_name: string | null }>
}) {
  return (
    <DoorOpsRegistrationList
      rows={rows}
      profileById={profileById}
      renderRowAction={(r) =>
        r.status === "confirmed" ? (
          <CheckInButton eventId={eventId} userId={r.user_id} />
        ) : r.status === "checked_in" ? (
          <UndoCheckInButton eventId={eventId} userId={r.user_id} />
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">—</span>
        )
      }
    />
  )
}
