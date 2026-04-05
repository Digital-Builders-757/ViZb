import { Users } from "lucide-react"
import { OrganizerEventAttendeesTable } from "@/components/organizer/event-attendees-table"

export function EventAttendeesPanel({
  total,
  confirmed,
  checkedIn,
  cancelled,
  rows,
  orgSlug,
  eventSlug,
  eventId,
  profileById,
}: {
  total: number
  confirmed: number
  checkedIn: number
  cancelled: number
  rows: { user_id: string; status: string; created_at: string; checked_in_at?: string | null }[]
  orgSlug: string
  eventSlug: string
  eventId: string
  profileById: Record<string, { display_name: string | null }>
}) {
  return (
    <div className="mt-6 form-card p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-cyan mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Attendees
          </h2>
          <p className="text-sm text-muted-foreground">
            Door list: filter, search, copy lists, and check guests in at the venue.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</div>
          <div className="mt-1 text-2xl font-bold font-mono text-brand-cyan">{total}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="border border-border p-3 card-accent-blue-mid">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Confirmed</div>
          <div className="mt-1 text-lg font-bold font-mono text-brand-blue-mid">{confirmed}</div>
        </div>
        <div className="border border-border p-3 card-accent-cyan">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Checked in</div>
          <div className="mt-1 text-lg font-bold font-mono text-brand-cyan">{checkedIn}</div>
        </div>
        <div className="border border-border p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cancelled</div>
          <div className="mt-1 text-lg font-bold font-mono text-muted-foreground">{cancelled}</div>
        </div>
        <div className="border border-border p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">RSVPs</div>
          <div className="mt-1 text-lg font-bold font-mono text-foreground">{rows.length}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
        </div>
      ) : (
        <OrganizerEventAttendeesTable
          orgSlug={orgSlug}
          eventSlug={eventSlug}
          eventId={eventId}
          rows={rows}
          profileById={profileById}
        />
      )}
    </div>
  )
}
