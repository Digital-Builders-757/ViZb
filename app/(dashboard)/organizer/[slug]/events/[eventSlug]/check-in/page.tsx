import Link from "next/link"
import { requireOrgMember } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { EventCheckInScanner } from "@/components/organizer/event-check-in-scanner"

export default async function OrganizerEventCheckInPage({
  params,
}: {
  params: Promise<{ slug: string; eventSlug: string }>
}) {
  const { slug: orgSlug, eventSlug } = await params

  const { org, membership, profile } = await requireOrgMember(orgSlug)
  const canScan =
    profile?.platform_role === "staff_admin" || ["owner", "admin"].includes(membership.role)

  if (!canScan) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-[color:var(--neon-text1)]">Only org owners/admins can check in attendees.</p>
        <NeonLink href={`/organizer/${orgSlug}/events/${eventSlug}`} className="mt-4 inline-flex" variant="secondary">
          Back
        </NeonLink>
      </GlassCard>
    )
  }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug")
    .eq("org_id", org.id)
    .eq("slug", eventSlug)
    .maybeSingle()

  if (!event) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-[color:var(--neon-text1)]">Event not found.</p>
        <NeonLink href={`/organizer/${orgSlug}`} className="mt-4 inline-flex" variant="secondary">
          Back
        </NeonLink>
      </GlassCard>
    )
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Check-in</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          {event.title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Scan tickets at the door. Paste fallback codes if the camera can&apos;t read.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <NeonLink href={`/organizer/${orgSlug}/events/${eventSlug}`} variant="secondary" className="sm:w-auto" shape="xl">
            Back to event
          </NeonLink>
          <Link
            href={`/events/${eventSlug}`}
            className="text-sm text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline"
          >
            View public page
          </Link>
        </div>
      </header>

      <EventCheckInScanner eventId={event.id} />

      <GlassCard className="p-4">
        <p className="text-xs text-[color:var(--neon-text2)]">
          Tip: Make sure <span className="font-mono">TICKET_QR_SECRET</span> is set in your environment.
        </p>
      </GlassCard>
    </div>
  )
}
