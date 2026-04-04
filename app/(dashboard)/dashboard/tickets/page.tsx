import Link from "next/link"
import { requireAuth } from "@/lib/auth-helpers"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import { GlassCard } from "@/components/ui/glass-card"

export default async function TicketsPage() {
  const { user, supabase } = await requireAuth()

  let rows:
    | {
        status: string
        created_at: string
        event: {
          title: string
          slug: string
          starts_at: string
          city: string
          venue_name: string
          flyer_url: string | null
        }[] | null
      }[]
    | null = null

  let loadError: string | null = null

  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        "status, created_at, event:events ( title, slug, starts_at, city, venue_name, flyer_url )",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) loadError = error.message
    rows = data
  } catch {
    loadError = "Ticketing is not fully configured on this environment yet."
    rows = null
  }

  const active = (rows || []).filter((r) => r.status !== "cancelled" && r.event && r.event.length > 0)

  return (
    <div className="space-y-8 md:space-y-10">
      <header>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Collection
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          My Tickets
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          All your upcoming and past event tickets in one place.
        </p>
      </header>

      {loadError ? (
        <GlassCard className="p-4">
          <p className="text-sm text-amber-200/90">{loadError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Apply <span className="font-mono">scripts/025_create_event_registrations.sql</span> to enable RSVP.
          </p>
        </GlassCard>
      ) : null}

      {active.length === 0 ? (
        <EmptyStateCard
          kicker="No tickets yet"
          title="Your collection is empty"
          description="When you RSVP or purchase tickets for events, they will appear here."
        >
          <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
            Explore events
          </NeonLink>
        </EmptyStateCard>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {active.map((r) => {
            const e = r.event![0]
            const when = new Date(e.starts_at).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })

            return (
              <Link key={`${e.slug}-${r.created_at}`} href={`/events/${e.slug}`} className="block">
                <GlassCard className="p-4 hover:border-[color:var(--neon-text2)]/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                        {when}
                      </p>
                      <h3 className="mt-1 font-serif text-lg font-bold text-[color:var(--neon-text0)] truncate">
                        {e.title}
                      </h3>
                      <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                        {e.venue_name} • {e.city}
                      </p>
                    </div>

                    <span className="shrink-0 border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/50 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
                      {r.status === "checked_in" ? "Checked in" : "RSVP"}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
