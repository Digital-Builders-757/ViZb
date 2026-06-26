import Link from "next/link"
import { EVENT_CATEGORY_OPTIONS } from "@/lib/events/categories"
import type { MemberPreferencesSnapshot } from "@/lib/member/preferences"
import { MEMBER_HOME_CITY_OPTIONS } from "@/lib/member/home-cities"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { SectionTitle } from "@/components/ui/section-title"

const VIBE_INTEREST_LABELS: Record<string, string> = {
  party: "Nightlife",
  music: "Music",
  concert: "Music",
  workshop: "Workshops",
  networking: "Networking",
  social: "Community",
  open_mic: "Music",
  other: "Community",
}

export function VibeProfileSection({
  preferences,
  profileCompletionPct,
  profileCompletionLabel,
}: {
  preferences: MemberPreferencesSnapshot
  profileCompletionPct: number
  profileCompletionLabel: string
}) {
  const cityLabels = preferences.homeCities
    .map((c) => MEMBER_HOME_CITY_OPTIONS.find((o) => o.value === c)?.label)
    .filter(Boolean) as string[]

  const interestLabels = [
    ...new Set(
      preferences.categories.map((c) => {
        const fromMap = VIBE_INTEREST_LABELS[c]
        if (fromMap) return fromMap
        return EVENT_CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c
      }),
    ),
  ]

  return (
    <section aria-labelledby="vibe-profile-heading" className="space-y-5">
      <SectionTitle kicker="Vibe profile" title="How you move through the city" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="rounded-none p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
            Profile completion
          </p>
          <p className="mt-2 font-serif text-3xl font-bold text-[color:var(--neon-text0)]">
            {profileCompletionPct}%
          </p>
          <p className="mt-1 text-sm text-[color:var(--neon-text1)]">{profileCompletionLabel}</p>
          <div className="mt-4 h-1.5 w-full bg-[color:var(--neon-bg1)]">
            <div
              className="h-full bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] transition-all"
              style={{ width: `${profileCompletionPct}%` }}
            />
          </div>
          <NeonLink href="/profile#culture-preferences" className="mt-5 inline-flex" shape="xl">
            Tune your vibe
          </NeonLink>
        </GlassCard>

        <GlassCard className="rounded-none p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Your interests
          </p>
          {interestLabels.length === 0 && cityLabels.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--neon-text1)]">
              No preferences set yet. Tell us what you&apos;re into — music, food, nightlife, workshops, and more.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {cityLabels.map((label) => (
                <span
                  key={`city-${label}`}
                  className="rounded-none border border-[color:var(--neon-b)]/40 bg-[color:var(--neon-b)]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)]"
                >
                  {label}
                </span>
              ))}
              {interestLabels.map((label) => (
                <span
                  key={`int-${label}`}
                  className="rounded-none border border-[color:var(--neon-hairline)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text1)]"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          <Link
            href="/profile"
            className="mt-5 inline-block font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] underline-offset-4 hover:underline"
          >
            Edit profile →
          </Link>
        </GlassCard>
      </div>
    </section>
  )
}
