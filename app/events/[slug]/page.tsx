import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { normalizeCategories } from "@/lib/events/categories"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { GlassCard } from "@/components/ui/glass-card"
import { EventRsvpCta } from "@/components/events/event-rsvp-cta"

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
}: {
  params: Promise<{ slug: string }>
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
      venue_name, address, city, categories, flyer_url,
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
  }

  const startsAt = new Date(event.starts_at)
  const endsAt = event.ends_at ? new Date(event.ends_at) : null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isSignedIn = !!user
  let initialRsvpStatus: "confirmed" | "cancelled" | "checked_in" | null = null

  if (user) {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("status")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (!error) {
        const status = data?.status as typeof initialRsvpStatus
        initialRsvpStatus = status ?? null
      }
    } catch {
      // In dev/staging, the migration may not be applied yet.
      initialRsvpStatus = null
    }
  }

  const authHref = `/login?redirect=${encodeURIComponent(`/events/${event.slug}`)}`

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

      <section className="pt-24 sm:pt-28 pb-16 md:pb-24 px-4 sm:px-8 overflow-x-hidden">
        <div className="max-w-[1200px] mx-auto min-w-0">
          {/* Back */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Events
          </Link>

          {/* Mobile: title & meta first; desktop: flyer left, details right */}
          <div className="mt-8 flex flex-col lg:flex-row gap-8 lg:gap-12 lg:items-start min-w-0">
            {/* Flyer */}
            <div className="w-full lg:w-1/2 shrink-0 order-2 lg:order-1 max-w-full min-w-0">
              <GlassCard className="relative aspect-[4/5] max-h-[min(70vh,520px)] lg:max-h-none overflow-hidden p-0 mx-auto lg:mx-0">
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
            <div className="w-full lg:w-1/2 flex flex-col justify-between min-w-0 order-1 lg:order-2">
              <div className="min-w-0">
                {/* Org */}
                <Link
                  href={`/events?org=${event.org_slug}`}
                  className="inline-block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)] hover:underline break-words"
                >
                  {event.org_name}
                </Link>

                {/* Title */}
                <h1 className="font-serif text-[1.625rem] sm:text-4xl md:text-5xl font-bold text-[color:var(--neon-text0)] mt-4 sm:mt-3 text-balance leading-[1.15] sm:leading-tight">
                  {event.title}
                </h1>

                {/* Date/Time */}
                <div className="mt-6 sm:mt-7 grid gap-3 sm:gap-4">
                  <GlassCard className="flex items-start gap-3 p-4 sm:p-5">
                    <Calendar className="w-5 h-5 text-[color:var(--neon-a)] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Date</p>
                      <p className="mt-1.5 text-[15px] sm:text-base text-[color:var(--neon-text0)] leading-snug break-words">
                        {dateStr}
                      </p>
                    </div>
                  </GlassCard>
                  <GlassCard className="flex items-start gap-3 p-4 sm:p-5">
                    <Clock className="w-5 h-5 text-[color:var(--neon-a)] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Time</p>
                      <p className="mt-1.5 text-[15px] sm:text-base text-[color:var(--neon-text0)] leading-snug">
                        {timeStr}
                        {endTimeStr && ` – ${endTimeStr}`}
                      </p>
                    </div>
                  </GlassCard>
                </div>

                {/* Location */}
                <div className="mt-4 sm:mt-5">
                  <GlassCard className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[color:var(--neon-a)] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Location</p>
                        <p className="mt-1.5 text-[15px] sm:text-base text-[color:var(--neon-text0)] leading-snug break-words">
                          {event.venue_name}
                        </p>
                        {event.address ? (
                          <p className="mt-1.5 text-sm text-[color:var(--neon-text1)] break-words">{event.address}</p>
                        ) : null}
                        <p className="mt-1.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] break-words">
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
              <div className="mt-8 sm:mt-10 min-w-0">
                <GlassCard className="p-4 sm:p-5 md:p-6 border-[color:var(--neon-hairline)]">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <p className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
                      RSVP
                    </p>
                    <p className="text-[11px] sm:text-xs text-[color:var(--neon-text2)] font-mono uppercase tracking-wider">
                      Free event · Tickets (coming soon)
                    </p>
                  </div>

                  <EventRsvpCta
                    eventId={event.id}
                    isSignedIn={isSignedIn}
                    initialStatus={initialRsvpStatus}
                    authHref={authHref}
                  />
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
