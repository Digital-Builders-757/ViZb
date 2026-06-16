import Link from "next/link"
import Image from "next/image"
import type { FeaturedMoment } from "@/lib/events/discovery-featured-moments"
import { formatCategoryLabel, sliceCategoriesForDisplay } from "@/lib/events/event-display-format"
import { getListingEventPriceLabel } from "@/lib/events/listing-event"
import { EventFlyerFallback } from "@/components/events/event-flyer-fallback"
import { EmptyStateCard } from "@/components/ui/empty-state-card"

export function EventsFeaturedMoment({ moment }: { moment: FeaturedMoment }) {
  if (moment.events.length === 0) {
    return (
      <div className="my-10 md:my-12">
        <EmptyStateCard
          title={moment.title}
          description={moment.emptyHint ?? "Nothing to highlight here yet."}
        />
      </div>
    )
  }

  return (
    <aside
      className="events-featured-moment my-10 rounded-2xl border border-[color:var(--neon-hairline)]/50 bg-[color:color-mix(in_srgb,var(--neon-surface)_18%,transparent)] p-5 backdrop-blur md:my-12 md:p-6"
      aria-labelledby={`featured-${moment.kind}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            id={`featured-${moment.kind}`}
            className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]"
          >
            {moment.title}
          </p>
          <p className="mt-1 max-w-prose text-xs text-[color:var(--neon-text1)]">{moment.subtitle}</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-1 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible lg:grid-cols-4">
        {moment.events.map((e) => {
          const { visible: cats } = sliceCategoriesForDisplay(e.categories, 1)
          const priceLabel = getListingEventPriceLabel(e.ticket_types, {
            isCommunity: e.event_kind === "community",
          })
          return (
            <Link
              key={`${moment.kind}-${e.id}`}
              href={`/events/${e.slug}`}
              className="events-neon-card events-neon-card-hover group snap-start flex w-[78vw] shrink-0 flex-col overflow-hidden rounded-xl border border-[color:var(--neon-hairline)]/90 bg-[color:var(--neon-surface)]/20 md:w-auto"
            >
              <div className="relative h-28 overflow-hidden bg-black/40">
                {e.flyer_url ? (
                  <Image
                    src={e.flyer_url}
                    alt=""
                    fill
                    sizes="240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <EventFlyerFallback
                    dayNumber={new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/New_York",
                      day: "numeric",
                    }).format(new Date(e.starts_at))}
                    monthShort={new Intl.DateTimeFormat("en-US", {
                      timeZone: "America/New_York",
                      month: "short",
                    }).format(new Date(e.starts_at))}
                    variant="banner"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/80 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="line-clamp-2 text-sm font-semibold text-[color:var(--neon-text0)]">{e.title}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  {e.city}
                  {priceLabel ? ` · ${priceLabel}` : null}
                </p>
                {cats[0] ? (
                  <span className="mt-auto inline-flex w-fit rounded-full border border-[color:var(--neon-hairline)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                    {formatCategoryLabel(cats[0])}
                  </span>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
