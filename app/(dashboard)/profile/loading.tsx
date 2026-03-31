import { GlassCard } from "@/components/ui/glass-card"

export default function ProfileLoading() {
  return (
    <div className="animate-pulse space-y-8 md:space-y-10">
      <header>
        <div className="h-3 w-16 rounded bg-[color:var(--neon-hairline)]" />
        <div className="mt-3 h-8 w-48 max-w-full rounded bg-[color:var(--neon-hairline)] md:h-9 md:w-56" />
        <div className="mt-3 h-4 w-full max-w-lg rounded bg-[color:var(--neon-hairline)]" />
      </header>

      <div className="max-w-lg space-y-5">
        <GlassCard className="flex items-center gap-4 p-5 md:p-6">
          <div className="h-14 w-14 shrink-0 rounded-full bg-[color:var(--neon-hairline)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-[color:var(--neon-hairline)]" />
            <div className="h-3 w-56 rounded bg-[color:var(--neon-hairline)]" />
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center gap-3 px-5 py-5 md:px-6">
            <div className="h-8 w-8 rounded-full bg-[color:var(--neon-hairline)]" />
            <div className="h-3 w-28 rounded bg-[color:var(--neon-hairline)]" />
          </div>
          <div className="border-t border-[color:var(--neon-hairline)]" />
          <div className="space-y-6 px-5 py-6 md:px-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-[color:var(--neon-hairline)]" />
                <div className="h-10 w-full rounded-lg bg-[color:color-mix(in_srgb,var(--neon-hairline)_70%,transparent)]" />
              </div>
            ))}
          </div>
          <div className="border-t border-[color:var(--neon-hairline)]" />
          <div className="px-5 py-4 md:px-6">
            <div className="h-11 w-36 rounded-xl bg-[color:var(--neon-hairline)]" />
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
