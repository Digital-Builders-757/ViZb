import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, MapPin, ArrowLeft, Users } from "lucide-react"
import type { Metadata } from "next"

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
  category: string
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
    return { title: "Event | ViZb" }
  }
  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("title, description, venue_name, city, flyer_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!event) return { title: "Event Not Found | ViZb" }

  return {
    title: `${event.title} | ViZb`,
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
      venue_name, address, city, category, flyer_url,
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
    category: rawEvent.category,
    flyer_url: rawEvent.flyer_url,
    org_name: org.name,
    org_slug: org.slug,
  }

  const startsAt = new Date(event.starts_at)
  const endsAt = event.ends_at ? new Date(event.ends_at) : null

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
    <main className="min-h-screen bg-background">
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
              <div className="relative aspect-[4/5] overflow-hidden border border-border bg-secondary">
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
                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-background text-[10px] sm:text-xs uppercase tracking-widest font-mono px-3 py-1.5">
                    {event.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between">
              <div>
                {/* Org */}
                <Link
                  href={`/events?org=${event.org_slug}`}
                  className="text-xs font-mono uppercase tracking-widest text-primary hover:underline"
                >
                  {event.org_name}
                </Link>

                {/* Title */}
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mt-3 text-balance leading-tight">
                  {event.title}
                </h1>

                {/* Date/Time */}
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-base text-foreground">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-base text-foreground">
                      {timeStr}
                      {endTimeStr && ` - ${endTimeStr}`}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-base text-foreground">{event.venue_name}</span>
                  </div>
                  {event.address && (
                    <p className="text-sm text-muted-foreground ml-8">{event.address}</p>
                  )}
                  <p className="text-sm text-muted-foreground ml-8 uppercase tracking-wider">{event.city}</p>
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                      About This Event
                    </h2>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}
              </div>

              {/* CTA area */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-widest">
                    <Users className="w-4 h-4" />
                    Free Event
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Ticket purchasing coming soon. For now, just show up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
