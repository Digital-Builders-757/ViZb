import Link from "next/link"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { ArrowLeft } from "lucide-react"

type ReportRow = {
  id: string
  body: string
  created_at: string
  user_id: string
  events:
    | { title: string; slug: string }
    | { title: string; slug: string }[]
    | null
}

function eventFromReport(r: ReportRow): { title: string; slug: string } | null {
  const ev = r.events
  if (ev == null) return null
  if (Array.isArray(ev)) return ev[0] ?? null
  return ev
}

export default async function AdminEventListingReportsPage() {
  await requireAdmin()

  if (!isServerSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <p className="text-sm text-muted-foreground">Supabase is not configured in this environment.</p>
        </GlassCard>
      </div>
    )
  }

  const supabase = await createClient()
  let rows: ReportRow[] = []
  let loadError: string | null = null

  try {
    const { data, error } = await supabase
      .from("event_listing_reports")
      .select("id, body, created_at, user_id, events ( title, slug )")
      .order("created_at", { ascending: false })
      .limit(120)

    if (error) {
      loadError = error.message
    } else {
      rows = (data as ReportRow[] | null) ?? []
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load reports."
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-neon-a transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Admin
      </Link>

      <div>
        <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground">Event listing reports</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Members flag listings from public event pages. Use this list to prioritize moderation — pairing with RSVP data and organizer context is recommended.
        </p>
      </div>

      {loadError ? (
        <GlassCard className="p-6 border border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-300">
            Reports table may be missing locally — apply migration{" "}
            <span className="font-mono">20260505184652_event_staff_pick_and_listing_reports.sql</span>.{" "}
            {loadError}
          </p>
        </GlassCard>
      ) : null}

      {!loadError && rows.length === 0 ? (
        <GlassCard className="p-8">
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        </GlassCard>
      ) : null}

      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((r) => {
            const ev = eventFromReport(r)
            const when = new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(r.created_at))

            return (
              <GlassCard key={r.id} className="p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{when}</p>
                    {ev ? (
                      <Link
                        href={`/events/${ev.slug}`}
                        className="mt-2 block font-semibold text-foreground underline-offset-4 hover:text-neon-a hover:underline"
                      >
                        {ev.title}
                      </Link>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-foreground">(Event unavailable)</p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
                    User {r.user_id.slice(0, 8)}…
                  </span>
                </div>
                <p className="mt-3 text-sm text-[color:var(--neon-text1)] whitespace-pre-wrap">{r.body}</p>
              </GlassCard>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
