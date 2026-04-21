import Link from "next/link"
import Image from "next/image"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, ImageIcon, Users } from "lucide-react"
import { FlyerUploadForm } from "@/components/organizer/flyer-upload-form"
import { GlassCard } from "@/components/ui/glass-card"
import { AdminEventRegistrationsTable } from "@/components/admin/event-registrations-table"
import { EventDetailsEditForm } from "@/components/organizer/event-details-edit-form"
import {
  OpenMicLineupPanel,
  type OpenMicLineupEntryRow,
} from "@/components/organizer/open-mic-lineup-panel"
import { normalizeCategories } from "@/lib/events/categories"
import { eventHasOpenMicCategory } from "@/lib/lineup/open-mic"

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
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-neon-a transition-colors"
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
    .select(
      "id, org_id, title, description, slug, status, starts_at, ends_at, venue_name, address, city, categories, rsvp_capacity, updated_at, flyer_url, organizations(name, slug)",
    )
    .eq("id", id)
    .single()

  if (!event) notFound()

  const flyerUrl = (event as { flyer_url?: string | null }).flyer_url ?? null

  const editFormCategories = normalizeCategories(
    (event as { categories?: unknown }).categories,
  )

  const orgRel = event.organizations as unknown as { slug: string } | null
  const organizerOrgSlug = orgRel?.slug ?? null

  let lineupEntries: OpenMicLineupEntryRow[] = []
  if (eventHasOpenMicCategory(editFormCategories)) {
    try {
      const { data: lu } = await supabase
        .from("event_lineup_entries")
        .select("id, performer_name, stage_name, notes, slot_order, status, is_public")
        .eq("event_id", id)
        .order("slot_order", { ascending: true })
        .order("id", { ascending: true })
      lineupEntries = (lu as OpenMicLineupEntryRow[]) ?? []
    } catch {
      lineupEntries = []
    }
  }

  // RSVP rollup (requires scripts/025_create_event_registrations.sql)
  let rows: { user_id: string; status: string; created_at: string; checked_in_at?: string | null }[] = []
  let rsvpError: string | null = null
  let profileById: Record<string, { display_name: string | null; avatar_url: string | null }> = {}

  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("user_id, status, created_at, checked_in_at")
      .eq("event_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      rsvpError = error.message
      rows = []
    } else {
      rows = (data as typeof rows) ?? []

      const ids = Array.from(new Set(rows.map((r) => r.user_id)))
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", ids)

        profileById = Object.fromEntries(
          (profiles ?? []).map((p) => [
            p.id as string,
            {
              display_name: (p as { display_name?: string | null }).display_name ?? null,
              avatar_url: (p as { avatar_url?: string | null }).avatar_url ?? null,
            },
          ]),
        )
      }
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
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-neon-a transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Admin
      </Link>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-neon-b font-mono">Event</span>
          <h1 className="mt-2 font-serif text-xl md:text-3xl font-bold text-foreground text-balance">
            {event.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            /events/{event.slug} • {event.city} • {event.venue_name}
          </p>
        </div>
      </div>

      <GlassCard emphasis className="card-accent-cyan mt-8 p-6 md:p-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-6 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Event Flyer
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-full md:w-64 aspect-[4/5] overflow-hidden border border-border bg-secondary shrink-0">
            {flyerUrl ? (
              <Image
                src={flyerUrl}
                alt={`Flyer for ${event.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ImageIcon className="w-10 h-10 text-[color:var(--neon-text2)]/70" />
                <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-widest">
                  No Flyer
                </p>
              </div>
            )}
          </div>

          <div className="flex-1">
            {["draft", "pending_review", "rejected"].includes(event.status as string) ? (
              <FlyerUploadForm eventId={event.id} currentFlyerUrl={flyerUrl} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {flyerUrl
                  ? "Flyer is set. Published events cannot have their flyer changed."
                  : "No flyer uploaded."}
              </p>
            )}
            {!flyerUrl &&
              ["draft", "rejected"].includes(event.status as string) && (
                <p className="mt-3 text-xs text-amber-500 font-mono">
                  A flyer is required before submitting for review.
                </p>
              )}
          </div>
        </div>
      </GlassCard>

      <GlassCard emphasis className="card-accent-cyan mt-8 p-6 md:p-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Event details
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Same editor as the organizer dashboard — use for urgent fixes (e.g. RSVP cap). Staff only.
        </p>
        <EventDetailsEditForm
          key={`${event.id}-${(event as { updated_at?: string }).updated_at ?? ""}`}
          event={{
            id: event.id,
            org_id: event.org_id as string,
            title: event.title as string,
            description: (event as { description?: string | null }).description ?? null,
            starts_at: event.starts_at as string,
            ends_at: (event as { ends_at?: string | null }).ends_at ?? null,
            venue_name: event.venue_name as string,
            address: (event as { address?: string | null }).address ?? null,
            city: event.city as string,
            categories: editFormCategories,
            status: event.status as string,
            rsvp_capacity: (event as { rsvp_capacity?: number | null }).rsvp_capacity ?? null,
            updated_at: (event as { updated_at?: string }).updated_at,
          }}
        />
      </GlassCard>

      {eventHasOpenMicCategory(editFormCategories) ? (
        <OpenMicLineupPanel
          eventId={event.id}
          eventSlug={event.slug as string}
          orgSlug={organizerOrgSlug}
          entries={lineupEntries}
          isArchived={event.status === "archived"}
          eventIsPublished={event.status === "published"}
        />
      ) : null}

      <GlassCard emphasis className="card-accent-cyan mt-8 p-6 md:p-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-2 flex items-center gap-2">
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
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</div>
            <div className="mt-1 text-lg font-bold font-mono text-foreground">{rows.length}</div>
          </div>
        </div>

        <AdminEventRegistrationsTable eventId={event.id} rows={rows} profileById={profileById} />
      </GlassCard>
    </div>
  )
}
