import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, Clock, MapPin, ArrowLeft, Users, Ticket, Mic2, ExternalLink } from "lucide-react"
import type { Metadata } from "next"
import { normalizeCategories } from "@/lib/events/categories"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { AppShell } from "@/components/ui/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { EventPremiumFlyer } from "@/components/events/event-premium-flyer"
import { DepthLayer } from "@/components/ui/depth-layer"
import { WaterFrame } from "@/components/ui/water-frame"
import { Suspense } from "react"
import { EventRsvpCta } from "@/components/events/event-rsvp-cta"
import { EventStripeReturn } from "@/components/events/event-stripe-return"
import { PostLoginIntentResolver } from "@/components/events/post-login-intent-resolver"
import { MyVibesButton } from "@/components/events/my-vibes-button"
import { EventProductAnalyticsBeacon } from "@/components/events/event-product-analytics-beacon"
import { buildEventAuthHref } from "@/lib/auth/post-login-intent"
import { formatCategoriesForAnalytics, type ProductEventContext } from "@/lib/analytics/product-events"
import { EventShareRow } from "@/components/events/event-share-row"
import { EventCalendarActions } from "@/components/dashboard/tickets/event-calendar-actions"
import { registrationStatusFromJoin } from "@/lib/tickets/registration-status-from-row"
import { mintFreeRsvpTicketForRegistration } from "@/lib/tickets/mint-free-rsvp-ticket"
import { eventHasOpenMicCategory } from "@/lib/lineup/open-mic"
import {
  eventKindBadgeLong,
  isCommunityEvent,
  parseExternalRsvpUrl,
  STAFF_PICK_BADGE_CLASS,
  STAFF_PICK_BADGE_LABEL,
} from "@/lib/events/event-kind"
import { EventPublicViewBeacon } from "@/components/events/event-public-view-beacon"
import { ReportEventListingDialog } from "@/components/events/report-event-listing-dialog"
import { EventRecapBanner } from "@/components/events/event-recap-banner"
import { FollowOrganizerButton } from "@/components/events/follow-organizer-button"
import { loadEventRecapPost, isEventPast } from "@/lib/events/event-recap"
import { isFollowingOrganizer } from "@/lib/follows/load-follows"

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
      venue_name, address, city, categories, flyer_url, rsvp_capacity, event_kind, external_rsvp_url, is_staff_pick,
      org_id, recap_post_id,
      organizations!inner ( id, name, slug )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!rawEvent) {
    notFound()
  }

  // Supabase returns the !inner join as an object { name, slug }
  const org = rawEvent.organizations as unknown as { id: string; name: string; slug: string }
  const orgId = (rawEvent as { org_id?: string }).org_id ?? org.id
  const recapPost = await loadEventRecapPost(
    supabase,
    (rawEvent as { recap_post_id?: string | null }).recap_post_id,
  )
  const eventIsPast = isEventPast(rawEvent.starts_at, rawEvent.ends_at)

  const listingCommunity = isCommunityEvent((rawEvent as { event_kind?: string | null }).event_kind)
  const staffPick = Boolean((rawEvent as { is_staff_pick?: boolean | null }).is_staff_pick)
  const externalField = (rawEvent as { external_rsvp_url?: string | null }).external_rsvp_url
  const externalParsed = listingCommunity ? parseExternalRsvpUrl(externalField) : null
  const externalRsvpHref = externalParsed?.ok ? externalParsed.url : null

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
    if (!listingCommunity) {
      const { data: occ, error: occErr } = await supabase.rpc("published_event_rsvp_occupied_count", {
        p_event_id: event.id,
      })
      if (!occErr && occ != null && Number.isFinite(Number(occ))) {
        rsvpOccupied = Number(occ)
      }
    }
  } catch {
    rsvpOccupied = 0
  }

  type PublicFreeTier = { id: string; name: string }
  type PublicPaidTier = { id: string; name: string; price_cents: number }
  let freeTicketTiers: PublicFreeTier[] = []
  let paidTicketTiers: PublicPaidTier[] = []
  if (!listingCommunity) {
    try {
      const { data: ttRows, error: ttError } = await supabase
        .from("ticket_types")
        .select("id, name, price_cents, sort_order, is_active, sales_starts_at, sales_ends_at, sales_start_at, sales_end_at")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true })

      if (ttError) {
        console.error("[events/[slug]] ticket_types query failed:", ttError.message)
      }

      const now = new Date()
      for (const row of ttRows ?? []) {
        const pr = row as {
          id: string
          name: string
          price_cents: number | null
          is_active?: boolean | null
          sales_starts_at: string | null
          sales_ends_at: string | null
          sales_start_at?: string | null
          sales_end_at?: string | null
        }
        if (pr.is_active === false) continue
        const saleStartsAt = pr.sales_start_at ?? pr.sales_starts_at
        const saleEndsAt = pr.sales_end_at ?? pr.sales_ends_at
        if (saleStartsAt && new Date(saleStartsAt) > now) continue
        if (saleEndsAt && new Date(saleEndsAt) < now) continue
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
    if (!listingCommunity) {
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

  let initialFollowingOrg = false
  if (user) {
    initialFollowingOrg = await isFollowingOrganizer(supabase, user.id, orgId)
  }

  const saveAuthHref = buildEventAuthHref(event.slug, "save_event")
  const rsvpAuthHref = buildEventAuthHref(event.slug, "rsvp_event")

  const productAnalyticsContext: ProductEventContext = {
    event_id: event.id,
    event_slug: event.slug,
    category: formatCategoriesForAnalytics(normalizeCategories(event.categories)),
    city: event.city ?? undefined,
    event_kind: listingCommunity ? ("community" as const) : ("official" as const),
    staff_pick: staffPick,
    signed_in: isSignedIn,
    source: "event_detail" as const,
  }

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
    <AppShell
      withNeonBackdrop
      causticVariant="subtle"
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <EventPublicViewBeacon slug={slug} />
        <Suspense fallback={null}>
          <EventProductAnalyticsBeacon context={productAnalyticsContext} />
        </Suspense>
        <Navbar />

        <Suspense fallback={null}>
          <PostLoginIntentResolver
            eventId={event.id}
            eventSlug={event.slug}
            isSignedIn={isSignedIn}
            initialSaved={initialVibesSaved}
          />
        </Suspense>

        <section className="vizb-motion-enter px-4 pb-16 pt-24 sm:px-8 sm:pt-28 md:pb-24">
        <DepthLayer level="far" className="pointer-events-none fixed inset-0 -z-[1] opacity-30" />
        <div className="max-w-[1200px] mx-auto">
          {/* Back */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-a)] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Events
          </Link>

          {/* Layout: flyer + details */}
          <div className="mt-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Flyer */}
            <div className="relative w-full lg:w-1/2">
              <EventPremiumFlyer
                title={event.title}
                flyerUrl={event.flyer_url}
                startsAt={event.starts_at}
                variant="detail"
                priority
              />
              {/* Category badges */}
              <div className="pointer-events-none absolute left-4 top-4 z-10 flex max-w-[min(100%,calc(100%-2rem))] flex-wrap gap-1.5">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest backdrop-blur ${
                      listingCommunity
                        ? "border-violet-500/55 bg-violet-500/25 text-[color:var(--neon-text0)]"
                        : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 text-[color:var(--neon-text0)]"
                    }`}
                  >
                    {listingCommunity ? "Local Event · not ViZb-hosted" : "ViZb Event"}
                  </span>
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
                <div className="mt-2">
                  <FollowOrganizerButton
                    orgId={orgId}
                    orgName={event.org_name}
                    initialFollowing={initialFollowingOrg}
                    signedIn={isSignedIn}
                  />
                </div>

                {/* Title */}
                <h1 className="mt-3 text-balance font-serif text-3xl font-bold leading-tight text-[color:var(--neon-text0)] sm:text-4xl md:text-5xl">
                  <span className="neon-gradient-text">{event.title}</span>
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/45 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
                    {listingCommunity ? eventKindBadgeLong("community") : eventKindBadgeLong("official")}
                  </span>
                  {staffPick ? (
                    <span className={`${STAFF_PICK_BADGE_CLASS} px-3 py-1`}>{STAFF_PICK_BADGE_LABEL}</span>
                  ) : null}
                  {listingCommunity ? (
                    <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)] max-w-xl">
                      Listed for discovery; hosted by a third party — confirm details with the organizer.
                    </p>
                  ) : null}
                </div>

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

                {eventIsPast && recapPost ? (
                  <div className="mt-6">
                    <EventRecapBanner recap={recapPost} />
                  </div>
                ) : null}
              </div>

              {/* CTA area */}
              <div className="mt-8">
                <GlassCard className="p-4 md:p-5">
                  {listingCommunity ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                            RSVP elsewhere
                          </p>
                          <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--neon-text1)]">
                            RSVP for this listing happens on the host&apos;s site. We&apos;ll open it in a new tab.
                          </p>
                        </div>
                      </div>
                      {externalRsvpHref ? (
                        <a
                          href={externalRsvpHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vibe-cta-gradient vibe-focus-ring inline-flex w-full min-h-11 items-center justify-center gap-2 px-8 py-3 text-xs font-mono font-bold uppercase tracking-widest sm:inline-flex sm:w-auto"
                        >
                          Open RSVP link
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                      ) : (
                        <p className="text-sm text-[color:var(--neon-text2)]">
                          RSVP link is not available right now — check back later.
                        </p>
                      )}

                      <div className="mt-4 space-y-3 border-t border-[color:var(--neon-hairline)] pt-4">
                        <MyVibesButton
                          eventId={event.id}
                          eventSlug={event.slug}
                          isSignedIn={isSignedIn}
                          initialSaved={initialVibesSaved}
                          authHref={saveAuthHref}
                          variant="detail"
                          analyticsContext={productAnalyticsContext}
                        />
                        <EventShareRow
                          shareUrl={eventPublicUrl}
                          title={event.title}
                          analyticsContext={productAnalyticsContext}
                        />
                        <EventCalendarActions
                          title={event.title}
                          startsAt={event.starts_at}
                          venueName={event.venue_name}
                          city={event.city}
                          eventUrl={eventPublicUrl}
                          className="mt-0"
                          analyticsContext={productAnalyticsContext}
                        />
                        <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
                          Save this listing to My Vibes to find it faster later.
                        </p>
                        {isSignedIn ? (
                          <NeonLink
                            href="/dashboard#my-vibes-week-heading"
                            variant="secondary"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            Open My Vibes
                          </NeonLink>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
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
                          analyticsContext={productAnalyticsContext}
                        />
                      </Suspense>

                      <div className="mt-4 space-y-3">
                        <MyVibesButton
                          eventId={event.id}
                          eventSlug={event.slug}
                          isSignedIn={isSignedIn}
                          initialSaved={initialVibesSaved}
                          authHref={saveAuthHref}
                          variant="detail"
                          analyticsContext={productAnalyticsContext}
                        />
                        <EventShareRow
                          shareUrl={eventPublicUrl}
                          title={event.title}
                          analyticsContext={productAnalyticsContext}
                        />
                        <EventCalendarActions
                          title={event.title}
                          startsAt={event.starts_at}
                          venueName={event.venue_name}
                          city={event.city}
                          eventUrl={eventPublicUrl}
                          className="mt-0"
                          analyticsContext={productAnalyticsContext}
                        />
                        <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
                          Saved events show up in your dashboard and calendar export.
                        </p>
                        {isSignedIn ? (
                          <NeonLink
                            href="/dashboard#my-vibes-week-heading"
                            variant="secondary"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            Open My Vibes
                          </NeonLink>
                        ) : null}
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

                      <div id="event-rsvp" className="scroll-mt-28">
                      <EventRsvpCta
                        key={[...freeTicketTiers.map((t) => t.id), ...paidTicketTiers.map((t) => t.id)].join("-")}
                        eventId={event.id}
                        isSignedIn={isSignedIn}
                        initialStatus={initialRsvpStatus}
                        authHref={rsvpAuthHref}
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
                        analyticsContext={productAnalyticsContext}
                      />

                      <p className="mt-3 text-[11px] text-[color:var(--neon-text2)]">
                        Free RSVP stays $0. Paid tiers use Stripe Checkout; canceling an RSVP does not refund card
                        charges.
                      </p>
                      </div>
                    </>
                  )}

                  <div className="mt-5 border-t border-[color:var(--neon-hairline)]/50 pt-4">
                    <ReportEventListingDialog
                      eventId={event.id}
                      eventSlug={event.slug}
                      isSignedIn={isSignedIn}
                      loginHref={saveAuthHref}
                    />
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
        </section>

        <OceanDivider variant="hero" density="normal" withLine className="mt-4" />

        <Footer />
      </main>
    </AppShell>
  )
}
