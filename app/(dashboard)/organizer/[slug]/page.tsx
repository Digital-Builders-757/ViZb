import { requireOrgMember } from "@/lib/auth-helpers"
import { normalizeCategories } from "@/lib/events/categories"
import { createClient } from "@/lib/supabase/server"
import { EventCardList } from "@/components/organizer/event-card-list"
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
          <span className="text-xs uppercase tracking-widest text-brand-blue-mid font-mono">Organizer</span>
          <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2 text-balance">{org.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 border ${
              isPending
                ? "border-muted-foreground/30 text-muted-foreground"
                : "border-brand-cyan/30 text-brand-cyan bg-brand-cyan/5"
            }`}>
              {isPending ? "Pending Review" : "Approved"}
            </span>
            <span className="text-xs text-muted-foreground truncate">/organizer/{slug}</span>
          </div>
        </div>

        {!isPending && (
          <Link
            href={`/organizer/${slug}/events/new`}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue to-brand-cyan text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(0,189,255,0.4)] transition-all w-full md:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        )}
      </div>

      {/* Pending review notice */}
      {isPending && (
        <div className="mt-8 border border-brand-blue-mid/20 bg-brand-blue-mid/5 p-6">
          <span className="text-xs font-mono uppercase tracking-widest text-brand-blue-mid">Under Review</span>
          <h3 className="text-lg font-bold text-foreground mt-2">Your organization is being reviewed</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            {"Our team will review your submission and approve it shortly. You'll be able to create events once approved."}
          </p>
        </div>
      )}

      {/* Stats */}
      {!isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-8 md:mt-10">
          <div className="border border-border p-4 md:p-6 card-accent-cyan">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-cyan" />
              <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground">Events</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-brand-cyan font-mono">{totalEvents}</span>
            <span className="block text-xs text-muted-foreground mt-1">{publishedEvents} published</span>
          </div>

          <div className="border border-border p-4 md:p-6 card-accent-blue-mid">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-brand-blue-mid" />
              <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground">Attendees</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-brand-blue-mid font-mono">0</span>
            <span className="block text-xs text-muted-foreground mt-1">Total attendees</span>
          </div>

          <div className="border border-border p-4 md:p-6 card-accent-blue">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-brand-blue" />
              <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground">Revenue</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-brand-blue font-mono">$0</span>
            <span className="block text-xs text-muted-foreground mt-1">Total revenue</span>
          </div>
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
                className="hidden sm:flex items-center gap-2 border border-brand-cyan/30 text-brand-cyan px-4 py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-brand-cyan/5 hover:shadow-[0_0_15px_rgba(0,189,255,0.15)] transition-all shrink-0"
              >
                <Plus className="w-3 h-3" />
                New Event
              </Link>
            )}
          </div>

          {eventList.length === 0 ? (
            <div className="mt-6 border border-dashed p-6 md:p-12 flex flex-col items-center text-center gradient-border">
              <span className="text-xs uppercase tracking-widest text-brand-cyan font-mono">No Events Yet</span>
              <h3 className="text-lg font-bold text-foreground uppercase mt-2">Create Your First Event</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Set up an event for your community and start selling tickets or collecting RSVPs.
              </p>
              <Link
                href={`/organizer/${slug}/events/new`}
                className="mt-6 bg-gradient-to-r from-brand-blue to-brand-cyan text-white px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(0,189,255,0.4)] transition-all"
              >
                Create Event
              </Link>
            </div>
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
