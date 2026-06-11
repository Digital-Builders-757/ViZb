import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import type { PostEventRecapPrompt } from "@/lib/events/post-event-recap-prompts"

export function PostEventRecapPromptsSection({ prompts }: { prompts: PostEventRecapPrompt[] }) {
  if (prompts.length === 0) return null

  return (
    <section aria-labelledby="recap-prompts-heading">
      <h2
        id="recap-prompts-heading"
        className="mb-4 font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl"
      >
        Memories from events you attended
      </h2>
      <div className="space-y-3">
        {prompts.map((p) => (
          <GlassCard key={p.eventId} className="p-4 md:p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-b)]">
              You checked in
            </p>
            <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
              Revisit <span className="font-semibold text-[color:var(--neon-text0)]">{p.eventTitle}</span> —{" "}
              <Link href={`/p/${p.recap.slug}`} className="text-[color:var(--neon-a)] underline-offset-4 hover:underline">
                {p.recap.title}
              </Link>
            </p>
          </GlassCard>
        ))}
      </div>
    </section>
  )
}
