import { Camera, Users } from "lucide-react"
import Link from "next/link"
import { OrganizerEventAttendeesTable } from "@/components/organizer/event-attendees-table"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

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
  rsvpCapacity = null,
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
  /** Max confirmed + checked-in RSVPs; null = no limit */
  rsvpCapacity?: number | null
}) {
  const towardCap = confirmed + checkedIn

  return (
    <GlassCard emphasis className="card-accent-cyan mt-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Attendees
          </h2>
          <p className="text-sm text-muted-foreground">
            RSVP rollup, manual actions, and fast QR check-in at the door.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:shrink-0 sm:items-end">
          <Button variant="default" size="sm" className="min-h-[44px] font-mono text-[10px] uppercase tracking-widest" asChild>
            <Link href={`/organizer/${orgSlug}/events/${eventSlug}/check-in`}>
              <Camera className="mr-2 h-3.5 w-3.5" />
              Door scanner
            </Link>
          </Button>
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</div>
            <div className="mt-1 text-2xl font-bold font-mono text-neon-a">{total}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="border border-border p-3 card-accent-blue-mid">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Confirmed</div>
          <div className="mt-1 text-lg font-bold font-mono text-neon-b">{confirmed}</div>
        </div>
        <div className="border border-border p-3 card-accent-cyan">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Checked in</div>
          <div className="mt-1 text-lg font-bold font-mono text-neon-a">{checkedIn}</div>
        </div>
        <div className="border border-border p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cancelled</div>
          <div className="mt-1 text-lg font-bold font-mono text-muted-foreground">{cancelled}</div>
        </div>
        <div className="border border-border p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Rows</div>
          <div className="mt-1 text-lg font-bold font-mono text-foreground">{rows.length}</div>
        </div>
      </div>

      {rsvpCapacity != null && rsvpCapacity > 0 ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/5 p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>RSVP limit use</span>
            <span className="text-foreground">
              {towardCap} / {rsvpCapacity}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/80">
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                towardCap >= rsvpCapacity ? "bg-amber-500/80" : "bg-[color:var(--neon-a)]/75",
              )}
              style={{ width: `${Math.min(100, (towardCap / rsvpCapacity) * 100)}%` }}
              role="progressbar"
              aria-valuenow={towardCap}
              aria-valuemin={0}
              aria-valuemax={rsvpCapacity}
            />
          </div>
          {towardCap >= rsvpCapacity ? (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-200/95">
              At the RSVP limit — consider raising the cap in Event details before opening more RSVPs publicly.
            </p>
          ) : rsvpCapacity - towardCap <= 5 && rsvpCapacity > towardCap ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Almost full ({rsvpCapacity - towardCap} spot{rsvpCapacity - towardCap === 1 ? "" : "s"} left at the
              limit).
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-[11px] font-mono text-muted-foreground">
        RSVP cap:{" "}
        {rsvpCapacity != null && rsvpCapacity > 0 ? (
          <span className="text-foreground">{rsvpCapacity}</span>
        ) : (
          <span className="text-foreground">none set (unlimited)</span>
        )}
        {rsvpCapacity != null && rsvpCapacity > 0 ? (
          <span> — confirmed + checked-in count toward this limit.</span>
        ) : null}
      </p>

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

      {rows.length > 200 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Showing first 200 RSVPs.</p>
      ) : null}
    </GlassCard>
  )
}
