import { Users } from "lucide-react"

export function EventAttendeesPanel({
  total,
  confirmed,
  checkedIn,
  cancelled,
  rows,
}: {
  total: number
  confirmed: number
  checkedIn: number
  cancelled: number
  rows: { user_id: string; status: string; created_at: string }[]
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
            RSVP rollup for this event. (User display details come next.)
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
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Rows</div>
          <div className="mt-1 text-lg font-bold font-mono text-foreground">{rows.length}</div>
        </div>
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <div className="border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
          </div>
        ) : (
          <div className="border border-border bg-black/20">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
              <div className="col-span-7">User ID</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2 text-right">Created</div>
            </div>
            {rows.slice(0, 25).map((r) => (
              <div
                key={`${r.user_id}-${r.created_at}`}
                className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border/60 last:border-b-0"
              >
                <div className="col-span-7 font-mono truncate">{r.user_id}</div>
                <div className="col-span-3 font-mono uppercase tracking-widest text-[10px] text-foreground/80">
                  {r.status}
                </div>
                <div className="col-span-2 text-right font-mono text-[10px]">
                  {new Date(r.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length > 25 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Showing first 25 RSVPs. Pagination + user details next.
          </p>
        ) : null}
      </div>
    </div>
  )
}
