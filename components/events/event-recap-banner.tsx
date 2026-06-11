import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import type { EventRecapPost } from "@/lib/events/event-recap"

export function EventRecapBanner({ recap }: { recap: EventRecapPost }) {
  return (
    <GlassCard className="border-[color:color-mix(in_srgb,var(--neon-b)_35%,var(--neon-hairline))] p-5 md:p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-b)]">
        Recap from VIZB
      </p>
      <h2 className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)]">{recap.title}</h2>
      {recap.excerpt ? (
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--neon-text1)]">{recap.excerpt}</p>
      ) : null}
      <NeonLink href={`/p/${recap.slug}`} className="mt-4 inline-flex" shape="xl">
        Read recap
      </NeonLink>
    </GlassCard>
  )
}

export function EventRecapPrompt({ recap }: { recap: EventRecapPost }) {
  return (
    <div className="rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-4">
      <p className="text-sm text-[color:var(--neon-text1)]">
        You were there — revisit the{" "}
        <Link href={`/p/${recap.slug}`} className="text-[color:var(--neon-a)] underline-offset-4 hover:underline">
          {recap.title}
        </Link>{" "}
        recap.
      </p>
    </div>
  )
}
