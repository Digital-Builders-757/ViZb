import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, MapPin, ArrowLeft, Users, Ticket, Mic2 } from "lucide-react"
import type { Metadata } from "next"
import { normalizeCategories } from "@/lib/events/categories"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { NeonButton } from "@/components/ui/neon-button"
import { Suspense } from "react"
import { EventRsvpCta } from "@/components/events/event-rsvp-cta"
import { EventStripeReturn } from "@/components/events/event-stripe-return"
import { MyVibesButton } from "@/components/events/my-vibes-button"
import { registrationStatusFromJoin } from "@/lib/tickets/registration-status-from-row"
import { mintFreeRsvpTicketForRegistration } from "@/lib/tickets/mint-free-rsvp-ticket"
import { eventHasOpenMicCategory } from "@/lib/lineup/open-mic"

interface PublicEvent {
  id: string
  title: string
  slug: string
  description: string | null
  starts_at: string
  ends_at: string | null
  venue_name: string
  address: string | null
  city: string
  categories: string[]
  flyer_url: string | null
  org_name: string
  org_slug: string
  rsvp_capacity: number | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isServerSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      await createClient()
    }
    return { title: "Event | VIZB" }
  }
  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("title, description, venue_name, city, flyer_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) return { title: "Event Not Found | VIZB" }

  return {
    title: `${event.title} | VIZB`,
    description: event.description || `${event.title} at ${event.venue_name}, ${event.city}`,
    openGraph: event.flyer_url
      ? { images: [{ url: event.flyer_url, width: 1200, height: 630 }] }
      : undefined,
  }
}

export default async function PublicEventDetailPage({
  params,
  searchParams: _searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ session_id?: string; checkout?: string }>
}) {
  const { slug } = await params
  if (!isServerSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      await createClient()
    }
    notFound()
  }
  const supabase = await createClient()

  const { data: rawEvent } = await supabase
    .from("events")
    .select(`
      id, title, slug, description, starts_at, ends_at,
      venue_name, address, city, categories, flyer_url, rsvp_capacity,
      organizations!inner ( name, slug )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!rawEvent) {
    notFound()
  }

  // Supabase returns the !inner join as an object { name, slug }
  const org = rawEvent.organizations as unknown as { name: string; slug: string }

  const cap = (rawEvent as { rsvp_capacity?: number | null }).rsvp_capacity
  const rsvp_capacity = cap == null || typeof cap !== "number" ? null : cap

  const event: PublicEvent = {
    id: rawEvent.id,
    title: rawEvent.title,
    slug: rawEvent.slug,
    description: rawEvent.description,
    starts_at: rawEvent.starts_at,
    ends_at: rawEvent.ends_at,
    venue_name: rawEvent.venue_name,
    address: rawEvent.address,
    city: rawEvent.city,
    categories: normalizeCategories(rawEvent.categories),
    flyer_url: rawEvent.flyer_url,
    org_name: org.name,
    org_slug: org.slug,
    rsvp_capacity,
  }

  let rsvpOccupied = 0
  try {
    const { data: occ, error: occErr } = await supabase.rpc("published_event_rsvp_occupied_count", {
      p_event_id: event.id,
    })
    if (!occErr && occ != null && Number.isFinite(Number(occ))) {
      rsvpOccupied = Number(occ)
    }
  } catch {
    rsvpOccupied = 0
  }

  type PublicFreeTier = { id: string; name: string }
  type PublicPaidTier = { id: string; name: string; price_cents: number }
  let freeTicketTiers: PublicFreeTier[] = []
  let paidTicketTiers: PublicPaidTier[] = []
  try {
    const { data: ttRows } = await supabase
      .from("ticket_types")
      .select("id, name, price_cents, sort_order, sales_starts_at, sales_ends_at")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })

    const now = new Date()
    for (const row of ttRows ?? []) {
      const pr = row as {
        id: string
        name: string
        price_cents: number | null
        sales_starts_at: string | null
        sales_ends_at: string | null
      }
      if (pr.sales_starts_at && new Date(pr.sales_starts_at) > now) continue
      if (pr.sales_ends_at && new Date(pr.sales_ends_at) < now) continue
      const pc = typeof pr.price_cents === "number" ? pr.price_cents : Number(pr.price_cents)
      if (!Number.isFinite(pc)) continue
      if (pc === 0) {
        freeTicketTiers.push({ id: pr.id, name: pr.name })
      } else if (pc > 0) {
        paidTicketTiers.push({ id: pr.id, name: pr.name, price_cents: pc })
      }
    }
  } catch {
    freeTicketTiers = []
    paidTicketTiers = []
  }

  const stripeCheckoutEnabled =
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim())

  const startsAt = new Date(event.starts_at)
  const endsAt = event.ends_at ? new Date(event.ends_at) : null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isSignedIn = !!user
  let initialRsvpStatus: "confirmed" | "cancelled" | "checked_in" | null = null

  let initialVibesSaved = false

  let hasActiveTicket = false
  let initialTicketId: string | null = null

  if (user) {
    try {
      const { data: ticketRows } = await supabase
        .from("tickets")
        .select("id, event_registrations!inner ( status )")
        .eq("user_id", user.id)
        .eq("event_id", event.id)

      const activeRows = (ticketRows ?? []).filter((row) => {
        const st = registrationStatusFromJoin(row.event_registrations)
        return st === "confirmed" || st === "checked_in"
      })
      hasActiveTicket = activeRows.length > 0
      initialTicketId = activeRows[0]?.id ?? null
    } catch {
      hasActiveTicket = false
      initialTicketId = null
    }

    let registrationId: string | null = null
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, status")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (!error) {
        registrationId = data?.id ?? null
        const status = data?.status as typeof initialRsvpStatus
        initialRsvpStatus = status ?? null
      }
    } catch {
      // In dev/staging, the migration may not be applied yet.
      initialRsvpStatus = null
      registrationId = null
    }

    if (
      registrationId &&
      (initialRsvpStatus === "confirmed" || initialRsvpStatus === "checked_in") &&
      !hasActiveTicket
    ) {
      const minted = await mintFreeRsvpTicketForRegistration(supabase, registrationId, null)
      if (!("error" in minted)) {
        try {
          const { data: ticketRowsAfter } = await supabase
            .from("tickets")
            .select("id, event_registrations!inner ( status )")
            .eq("user_id", user.id)
            .eq("event_id", event.id)

          const activeAfter = (ticketRowsAfter ?? []).filter((row) => {
            const st = registrationStatusFromJoin(row.event_registrations)
            return st === "confirmed" || st === "checked_in"
          })
          hasActiveTicket = activeAfter.length > 0
          initialTicketId = activeAfter[0]?.id ?? null
        } catch {
          hasActiveTicket = false
          initialTicketId = null
        }
      }
    }

    try {
      const { data: vibeRow } = await supabase
        .from("event_saves")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle()
      initialVibesSaved = !!vibeRow
    } catch {
      initialVibesSaved = false
    }
  }

  const authHref = `/login?redirect=${encodeURIComponent(`/events/${event.slug}`)}`

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? ""
  const eventPublicUrl = siteBase ? `${siteBase}/events/${event.slug}` : `/events/${event.slug}`

  const dateStr = startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const timeStr = startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  const endTimeStr = endsAt
    ? endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null

  return (
    <main className="min-h-screen bg-[color:var(--neon-bg0)]">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-16 md:pb-24 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Back */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Events
          </Link>

          {/* Layout: flyer + details */}
          <div className="mt-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Flyer */}
            <div className="w-full lg:w-1/2">
              <GlassCard className="relative aspect-[4/5] overflow-hidden p-0">
                {event.flyer_url ? (
                  <Image
                    src={event.flyer_url}
                    alt={`Flyer for ${event.title}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-7xl md:text-9xl font-bold text-primary/15 font-mono">
                      {startsAt.getDate()}
                    </span>
                    <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mt-2">
                      {startsAt.toLocaleDateString("en-US", { month: "long" })}
                    </p>
                  </div>
                )}
                {/* Category badges */}
                <div className="absolute top-4 left-4 flex max-w-[min(100%,calc(100%-2rem))] flex-wrap gap-1.5">
                  {event.categories.length > 0 ? (
                    event.categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur"
                      >
                        {formatCategoryLabel(c)}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                      Event
                    </span>
                  )}
                </div>

                {/* readability overlay */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[color:var(--neon-bg0)]/90 via-[color:var(--neon-bg0)]/25 to-transparent"
                  aria-hidden
                />
              </GlassCard>
            </div>

            {/* Details */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between">
              <div>
                {/* Org */}
                <Link
                  href={`/events?org=${event.org_slug}`}
                  className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)] hover:underline"
                >
                  {event.org_name}
                </Link>

                {/* Title */}
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[color:var(--neon-text0)] mt-3 text-balance leading-tight">
                  {event.title}
                </h1>

                {/* Date/Time */}
                <div className="mt-6 grid gap-3">
                  <GlassCard className="flex items-start gap-3 p-4">
                    <Calendar className="w-5 h-5 text-[color:var(--neon-a)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Date</p>
                      <p className="mt-1 text-base text-[color:var(--neon-text0)]">{dateStr}</p>
                    </div>
                  </GlassCard>
                  <GlassCard className="flex items-start gap-3 p-4">
                    <Clock className="w-5 h-5 shrink-0 text-[color:var(--neon-b)]" />
                    <div className="min-w-0">
                      <p className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Time</p>
                      <p className="mt-1 text-base text-[color:var(--neon-text0)]">
                        {timeStr}
                        {endTimeStr && ` - ${endTimeStr}`}
                      </p>
                    </div>
                  </GlassCard>
                </div>

                {/* Location */}
                <div className="mt-4">
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[color:var(--neon-a)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Location</p>
                        <p className="mt-1 text-base text-[color:var(--neon-text0)]">{event.venue_name}</p>
                        {event.address ? (
                          <p className="mt-1 text-sm text-[color:var(--neon-text1)]">{event.address}</p>
                        ) : null}
                        <p className="mt-1 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                          {event.city}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mt-6">
                    <GlassCard className="p-4 md:p-5">
                      <h2 className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                        About this event
                      </h2>
                      <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)] whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </GlassCard>
                  </div>
                )}
              </div>

              {/* CTA area */}
              <div className="mt-8">
                <GlassCard className="p-4 md:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-[color:var(--neon-text2)] font-mono uppercase tracking-widest">
                      <Users className="w-4 h-4" />
                      {paidTicketTiers.length > 0 ? "Tickets & RSVP" : "RSVP"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[color:var(--neon-text2)] font-mono uppercase tracking-widest">
                      <Ticket className="w-4 h-4" />
                      {stripeCheckoutEnabled && paidTicketTiers.length > 0
                        ? "Card checkout"
                        : paidTicketTiers.length > 0
                          ? "Configure Stripe"
                          : "Free tier"}
                    </div>
                  </div>

                  <Suspense fallback={null}>
                    <EventStripeReturn
                      eventPath={`/events/${event.slug}`}
                      eventTitle={event.title}
                      startsAt={event.starts_at}
                      venueName={event.venue_name}
                      city={event.city}
                      eventPublicUrl={eventPublicUrl}
                    />
                  </Suspense>

                  <div className="mt-4">
                    <MyVibesButton
                      eventId={event.id}
                      eventSlug={event.slug}
                      isSignedIn={isSignedIn}
                      initialSaved={initialVibesSaved}
                      authHref={authHref}
                      variant="detail"
                    />
                  </div>

                  {eventHasOpenMicCategory(event.categories) ? (
                    <div className="mt-4">
                      <Link
                        href={`/lineup/${event.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)] hover:underline"
                      >
                        <Mic2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        Open mic lineup
                      </Link>
                      <p className="mt-1 text-[11px] text-[color:var(--neon-text2)]">
                        Shareable order of performers (when the host marks slots public).
                      </p>
                    </div>
                  ) : null}

                  <EventRsvpCta
                    key={[...freeTicketTiers.map((t) => t.id), ...paidTicketTiers.map((t) => t.id)].join("-")}
                    eventId={event.id}
                    isSignedIn={isSignedIn}
                    initialStatus={initialRsvpStatus}
                    authHref={authHref}
                    rsvpCapacity={event.rsvp_capacity}
                    rsvpOccupied={rsvpOccupied}
                    freeTicketTiers={freeTicketTiers}
                    paidTicketTiers={paidTicketTiers}
                    stripeCheckoutEnabled={stripeCheckoutEnabled}
                    hasActiveTicket={hasActiveTicket}
                    initialTicketId={initialTicketId}
                    eventTitle={event.title}
                    startsAt={event.starts_at}
                    venueName={event.venue_name}
                    city={event.city}
                    eventPublicUrl={eventPublicUrl}
                  />

                  <p className="mt-3 text-[11px] text-[color:var(--neon-text2)]">
                    Free RSVP stays $0. Paid tiers use Stripe Checkout; canceling an RSVP does not refund card
                    charges.
                  </p>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
