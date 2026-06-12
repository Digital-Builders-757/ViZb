import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { EventCheckInScanner } from "@/components/organizer/event-check-in-scanner"

export default async function AdminEventCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  if (!isServerSupabaseConfigured()) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Supabase is not configured.</p>
        <NeonLink href={`/admin/events/${id}`} className="mt-4 inline-flex" variant="secondary">
          Back
        </NeonLink>
      </GlassCard>
    )
  }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, status, starts_at, venue_name, city")
    .eq("id", id)
    .maybeSingle()

  if (!event) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-[color:var(--neon-text1)]">Event not found.</p>
        <NeonLink href="/admin/events" className="mt-4 inline-flex" variant="secondary">
          Back to events
        </NeonLink>
      </GlassCard>
    )
  }

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href={`/admin/events/${id}`}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-neon-a transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to event
      </Link>

      <header className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Door check-in</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          {event.title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Staff scanner for platform events. Scan ticket QR codes or paste backup tokens at the door.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <NeonLink href={`/admin/events/${id}`} variant="secondary" className="sm:w-auto" shape="xl">
            Event admin
          </NeonLink>
          <Link
            href={`/events/${event.slug}`}
            className="text-sm text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline"
          >
            View public page
          </Link>
        </div>
      </header>

      <EventCheckInScanner
        eventId={event.id}
        eventMeta={{
          title: event.title,
          startsAt: event.starts_at,
          venueName: event.venue_name,
          city: event.city,
        }}
      />

      <GlassCard className="p-4">
        <p className="text-xs text-[color:var(--neon-text2)]">
          Tip: Make sure <span className="font-mono">TICKET_QR_SECRET</span> is set in your environment.
        </p>
      </GlassCard>
    </div>
  )
}
