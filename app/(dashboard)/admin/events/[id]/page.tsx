import Link from "next/link"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Users } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { CheckInButton } from "@/components/admin/check-in-button"

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  if (!isServerSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-cyan transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Admin
        </Link>
        <GlassCard className="p-6">
          <p className="text-sm text-muted-foreground">
            Supabase server environment is not configured on this environment.
          </p>
        </GlassCard>
      </div>
    )
  }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, status, starts_at, venue_name, city, organizations(name, slug)")
    .eq("id", id)
    .single()

  if (!event) notFound()

  // RSVP rollup (requires scripts/025_create_event_registrations.sql)
  let rows: { user_id: string; status: string; created_at: string }[] = []
  let rsvpError: string | null = null

  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("user_id, status, created_at")
      .eq("event_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      rsvpError = error.message
      rows = []
    } else {
      rows = (data as typeof rows) ?? []
    }
  } catch {
    rsvpError = "event_registrations table not available"
    rows = []
  }

  const confirmed = rows.filter((r) => r.status === "confirmed").length
  const checkedIn = rows.filter((r) => r.status === "checked_in").length
  const cancelled = rows.filter((r) => r.status === "cancelled").length

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-cyan transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Admin
      </Link>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-blue-mid font-mono">Event</span>
          <h1 className="mt-2 font-serif text-xl md:text-3xl font-bold text-foreground text-balance">
            {event.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            /events/{event.slug} • {event.city} • {event.venue_name}
          </p>
        </div>
      </div>

      <div className="mt-8 form-card p-6 md:p-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-cyan mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          RSVPs
        </h2>
        <p className="text-sm text-muted-foreground">
          Staff rollup for this event.
        </p>

        {rsvpError ? (
          <div className="mt-4 border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-400">RSVP data unavailable: {rsvpError}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Apply <span className="font-mono">scripts/025_create_event_registrations.sql</span> on the target Supabase project.
            </p>
          </div>
        ) : null}

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
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</div>
            <div className="mt-1 text-lg font-bold font-mono text-foreground">{rows.length}</div>
          </div>
        </div>

        <div className="mt-5 border border-border bg-black/20">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
            <div className="col-span-6">User ID</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-2 text-right">Created</div>
          </div>
          {rows.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
            </div>
          ) : (
            rows.slice(0, 50).map((r) => (
              <div
                key={`${r.user_id}-${r.created_at}`}
                className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border/60 last:border-b-0"
              >
                <div className="col-span-6 font-mono truncate">{r.user_id}</div>
                <div className="col-span-2 font-mono uppercase tracking-widest text-[10px] text-foreground/80">
                  {r.status}
                </div>
                <div className="col-span-2">
                  {r.status === "confirmed" ? (
                    <CheckInButton eventId={event.id} userId={r.user_id} />
                  ) : r.status === "checked_in" ? (
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-brand-cyan">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Checked in
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      —
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-right font-mono text-[10px]">
                  {new Date(r.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {rows.length > 50 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">Showing first 50 RSVPs.</p>
        ) : null}
      </div>
    </div>
  )
}
