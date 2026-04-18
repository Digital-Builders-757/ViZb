import { requireOrgMember } from "@/lib/auth-helpers"
import { normalizeCategories } from "@/lib/events/categories"
import { createClient } from "@/lib/supabase/server"
import { EventCardList } from "@/components/organizer/event-card-list"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { Calendar, Users, TrendingUp, Plus } from "lucide-react"

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org, membership } = await requireOrgMember(slug)
  const supabase = await createClient()

  const isPending = org.status === "pending_review"
  const isOwner = membership.role === "owner"

  // Fetch events for this org
  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, status, starts_at, ends_at, venue_name, city, categories, review_notes, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })

  const eventList = (events ?? []).map((e) => ({
    ...e,
    categories: normalizeCategories((e as { categories?: unknown }).categories),
  }))
  const totalEvents = eventList.length
  const publishedEvents = eventList.filter(e => e.status === "published").length

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-neon-b font-mono">Organizer</span>
          <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2 text-balance">{org.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border ${
              isPending
                ? "border-muted-foreground/30 text-muted-foreground"
                : "border-neon-a/30 text-neon-a bg-neon-a/5"
            }`}>
              {isPending ? "Pending Review" : "Approved"}
            </span>
            <span className="text-xs text-muted-foreground truncate">/organizer/{slug}</span>
          </div>
        </div>

        {!isPending && (
          <Link
            href={`/organizer/${slug}/events/new`}
            className="vibe-cta-gradient vibe-focus-ring flex w-full shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3 text-xs font-bold uppercase tracking-widest md:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        )}
      </div>

      {/* Pending review notice */}
      {isPending && (
        <GlassCard className="mt-8 border-neon-b/25 bg-neon-b/[0.06] p-6" emphasis>
          <span className="text-xs font-mono uppercase tracking-widest text-neon-b">Under Review</span>
          <h3 className="mt-2 text-lg font-bold text-foreground">Your organization is being reviewed</h3>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {"Our team will review your submission and approve it shortly. You'll be able to create events once approved."}
          </p>
        </GlassCard>
      )}

      {/* Stats */}
      {!isPending && (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 md:mt-10 md:gap-4">
          <GlassCard className="card-accent-cyan p-4 md:p-6">
            <div className="mb-3 flex items-center gap-3 md:mb-4">
              <Calendar className="h-4 w-4 text-neon-a md:h-5 md:w-5" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:text-xs">
                Events
              </span>
            </div>
            <span className="font-mono text-2xl font-bold text-neon-a md:text-3xl">{totalEvents}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{publishedEvents} published</span>
          </GlassCard>

          <GlassCard className="card-accent-blue-mid p-4 md:p-6">
            <div className="mb-3 flex items-center gap-3 md:mb-4">
              <Users className="h-4 w-4 text-neon-b md:h-5 md:w-5" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:text-xs">
                Attendees
              </span>
            </div>
            <span className="font-mono text-2xl font-bold text-neon-b md:text-3xl">0</span>
            <span className="mt-1 block text-xs text-muted-foreground">Total attendees</span>
          </GlassCard>

          <GlassCard className="card-accent-cyan-bright p-4 md:p-6">
            <div className="mb-3 flex items-center gap-3 md:mb-4">
              <TrendingUp className="h-4 w-4 text-neon-c md:h-5 md:w-5" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:text-xs">
                Revenue
              </span>
            </div>
            <span className="font-mono text-2xl font-bold text-neon-c md:text-3xl">$0</span>
            <span className="mt-1 block text-xs text-muted-foreground">Total revenue</span>
          </GlassCard>
        </div>
      )}

      {/* Events section */}
      {!isPending && (
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Events</span>
              <h2 className="font-serif text-xl font-bold text-foreground mt-2">Your Events</h2>
            </div>
            {eventList.length > 0 && (
              <Link
                href={`/organizer/${slug}/events/new`}
                className="hidden sm:flex items-center gap-2 border border-neon-a/30 text-neon-a px-4 py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-neon-a/5 hover:shadow-[0_0_15px_rgba(0,189,255,0.15)] transition-all shrink-0"
              >
                <Plus className="w-3 h-3" />
                New Event
              </Link>
            )}
          </div>

          {eventList.length === 0 ? (
            <GlassCard className="gradient-border mt-6 flex flex-col items-center border-dashed p-6 text-center md:p-12" emphasis>
              <span className="font-mono text-xs uppercase tracking-widest text-neon-a">No Events Yet</span>
              <h3 className="mt-2 text-lg font-bold uppercase text-foreground">Create Your First Event</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Set up an event for your community and start selling tickets or collecting RSVPs.
              </p>
              <Link
                href={`/organizer/${slug}/events/new`}
                className="vibe-cta-gradient vibe-focus-ring mt-6 rounded-lg px-8 py-4 text-xs font-bold uppercase tracking-widest"
              >
                Create Event
              </Link>
            </GlassCard>
          ) : (
            <div className="mt-5">
              <EventCardList events={eventList} orgSlug={slug} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
