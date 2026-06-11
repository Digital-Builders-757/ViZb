import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import type { ScoredRecommendation } from "@/lib/events/member-recommendations"
import { formatCategoryLabels, formatDashboardEventWhen } from "@/lib/events/upcoming-preview"

export function FollowedOrganizersRail({ items }: { items: ScoredRecommendation[] }) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="followed-orgs-heading">
      <div className="mb-4">
        <h2
          id="followed-orgs-heading"
          className="font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl"
        >
          From organizers you follow
        </h2>
        <p className="mt-1 text-[15px] text-[color:var(--neon-text2)]">
          Upcoming events from organizers you follow.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((ev) => (
          <Link key={ev.id} href={`/events/${ev.slug}`} className="block">
            <GlassCard className="p-4 transition-[box-shadow] hover:shadow-[var(--vibe-neon-glow-subtle)]">
              <h3 className="font-semibold text-[color:var(--neon-text0)]">{ev.title}</h3>
              <p className="mt-1 text-sm text-[color:var(--neon-text2)]">
                {ev.org_name ?? "Organizer"} · {ev.city} · {formatDashboardEventWhen(ev.starts_at, ev.ends_at)}
              </p>
              <span className="mt-2 inline-flex rounded-full border border-[color:var(--neon-hairline)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)]">
                {formatCategoryLabels(ev.categories)}
              </span>
            </GlassCard>
          </Link>
        ))}
      </div>
      <NeonLink href="/events?discover=for-you" className="mt-4 inline-flex" shape="pill">
        See personalized feed
      </NeonLink>
    </section>
  )
}
