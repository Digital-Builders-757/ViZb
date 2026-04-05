"use client"

import { DoorOpsRegistrationList } from "@/components/door-ops/door-ops-registration-list"
import { OrganizerCheckInButton } from "@/components/organizer/check-in-button"
import { OrganizerUndoCheckInButton } from "@/components/organizer/undo-check-in-button"

type Row = {
  user_id: string
  status: "confirmed" | "cancelled" | "checked_in" | string
  created_at: string
  checked_in_at?: string | null
}

export function OrganizerEventAttendeesTable({
  orgSlug,
  eventSlug,
  eventId,
  rows,
  profileById,
}: {
  orgSlug: string
  eventSlug: string
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
          <OrganizerCheckInButton
            orgSlug={orgSlug}
            eventSlug={eventSlug}
            eventId={eventId}
            userId={r.user_id}
          />
        ) : r.status === "checked_in" ? (
          <OrganizerUndoCheckInButton
            orgSlug={orgSlug}
            eventSlug={eventSlug}
            eventId={eventId}
            userId={r.user_id}
          />
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">—</span>
        )
      }
    />
  )
}
