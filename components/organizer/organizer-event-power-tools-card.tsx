import { Eye, UserCheck, Users } from "lucide-react"

import { GlassCard } from "@/components/ui/glass-card"
import { OrganizerDuplicateEventDraft } from "@/components/organizer/organizer-duplicate-event-draft"

export function OrganizerEventPowerToolsCard({
  orgSlug,
  eventId,
  eventStatus,
  viewCount,
  activeRsvps,
  checkedInCount,
  showDuplicate,
}: {
  orgSlug: string
  eventId: string
  eventStatus: string
  viewCount: number
  /** Confirmed + checked-in registrations (matches public cap logic). */
  activeRsvps: number
  checkedInCount: number
  showDuplicate: boolean
}) {
  const viewsHelp =
    eventStatus === "published"
      ? "Approx. opens of the public event page (counts after migration is applied)."
      : "Counts only while published and live on /events/[slug]."

  return (
    <GlassCard className="card-accent-blue-mid mt-6 p-6 md:p-8">
      <span className="text-xs font-mono uppercase tracking-widest text-neon-a">Power tools</span>
      <h2 className="mt-2 font-serif text-xl font-bold text-foreground md:text-2xl">Quick snapshot</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground leading-relaxed">{viewsHelp}</p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-neon-a" aria-hidden />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Listing views
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">{viewCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neon-b" aria-hidden />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">RSVPs active</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">{activeRsvps}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Confirmed + checked in</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-400" aria-hidden />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Checked in</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">{checkedInCount}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Door admissions</p>
        </div>
      </div>

      {showDuplicate ? (
        <div className="mt-8 border-t border-border pt-6">
          <OrganizerDuplicateEventDraft sourceEventId={eventId} orgSlug={orgSlug} disabled={false} />
        </div>
      ) : (
        <p className="mt-6 border-t border-border pt-6 text-[11px] font-mono text-muted-foreground">
          Duplicating requires owner, admin, or editor role.
        </p>
      )}
    </GlassCard>
  )
}
