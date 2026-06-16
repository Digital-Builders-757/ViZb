import Link from "next/link"
import Image from "next/image"
import { Sparkles, Users, Heart } from "lucide-react"
import type { DashboardEventPreview } from "@/lib/events/upcoming-preview"
import type { ScoredRecommendation } from "@/lib/events/member-recommendations"
import type { LocalPulseDigestLine } from "@/lib/dashboard/dashboard-home-types"
import {
  formatCategoryLabels,
  formatDashboardEventWhen,
} from "@/lib/events/upcoming-preview"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { SectionTitle } from "@/components/ui/section-title"

const CULTURE_PICKS = [
  { label: "Parties & nightlife", category: "party" as const, icon: Sparkles },
  { label: "Network & connect", category: "networking" as const, icon: Users },
  { label: "Workshops & builds", category: "workshop" as const, icon: Heart },
] as const

export function LocalPulseSection({
  trending,
  followedOrgEvents,
  pulseDigest,
  region,
}: {
  trending: DashboardEventPreview[]
  followedOrgEvents: ScoredRecommendation[]
  pulseDigest: LocalPulseDigestLine[]
  region: string
}) {
  const trendingSlice = trending.slice(0, 2)
  const followedSlice = followedOrgEvents.slice(0, 2)
  const hasContent = trendingSlice.length > 0 || followedSlice.length > 0 || pulseDigest.length > 0

  return (
    <section aria-labelledby="local-pulse-heading" className="space-y-5">
      <SectionTitle kicker="Local pulse" title="What's moving near you" />

      {pulseDigest.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {pulseDigest.map((line) => (
            <li key={line.label}>
              <GlassCard className="rounded-none p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                  {line.label}
                </p>
                <p className="mt-1 text-sm text-[color:var(--neon-text1)]">{line.detail}</p>
              </GlassCard>
            </li>
          ))}
        </ul>
      ) : null}

      {!hasContent ? (
        <GlassCard className="rounded-none p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Quiet week in {region}
          </p>
          <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
            Check back soon — or open the full timeline for everything published.
          </p>
          <NeonLink href="/events" className="mt-4 inline-flex" shape="xl">
            Open full timeline
          </NeonLink>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {trendingSlice.length > 0 ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                  Popular this weekend
                </p>
                {trendingSlice.map((ev) => (
                  <Link key={ev.id} href={`/events/${ev.slug}`} className="block">
                    <GlassCard className="overflow-hidden rounded-none p-0 transition-shadow hover:shadow-[var(--vibe-neon-glow-subtle)]">
                      <div className="flex flex-col sm:flex-row">
                        {ev.flyer_url ? (
                          <div className="relative h-28 w-full shrink-0 sm:w-32">
                            <Image src={ev.flyer_url} alt="" fill className="object-cover" sizes="128px" />
                          </div>
                        ) : null}
                        <div className="p-4">
                          <h3 className="font-serif text-base font-bold text-[color:var(--neon-text0)]">
                            {ev.title}
                          </h3>
                          <p className="mt-1 text-xs text-[color:var(--neon-text1)]">
                            {ev.city} · {formatDashboardEventWhen(ev.starts_at, ev.ends_at)}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </>
            ) : null}
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-b)]">
              Culture shortcuts
            </p>
            {CULTURE_PICKS.map(({ label, category, icon: Icon }) => (
              <Link key={category} href={`/events?category=${category}`} className="block">
                <GlassCard className="flex items-center gap-3 rounded-none p-3 transition-shadow hover:shadow-[var(--vibe-neon-glow-subtle)]">
                  <Icon className="h-4 w-4 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
                  <span className="text-sm font-semibold text-[color:var(--neon-text0)]">{label}</span>
                </GlassCard>
              </Link>
            ))}

            {followedSlice.length > 0 ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  From organizers you follow
                </p>
                {followedSlice.map((ev) => (
                  <Link key={ev.id} href={`/events/${ev.slug}`} className="block">
                    <GlassCard className="rounded-none p-3">
                      <p className="text-sm font-semibold text-[color:var(--neon-text0)]">{ev.title}</p>
                      <p className="mt-1 text-xs text-[color:var(--neon-text2)]">
                        {formatCategoryLabels(ev.categories)}
                      </p>
                    </GlassCard>
                  </Link>
                ))}
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
