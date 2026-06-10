import { Navbar } from "@/components/navbar"

export default function EventsLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--neon-bg0)]">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,209,255,0.08),transparent_55%)]" />
      <div className="fixed inset-0 z-[1] bg-[color:var(--neon-bg0)]/45" />

      <div className="relative z-10">
        <Navbar />

        <section className="px-4 pb-12 pt-24 sm:px-8 sm:pt-28 md:pb-16 md:pt-32">
          <div className="mx-auto max-w-[1200px]">
            <div className="h-3 w-32 animate-pulse rounded bg-[color:var(--neon-surface)]/40" />
            <div className="mt-6 flex flex-col gap-2">
              <div className="h-12 w-48 animate-pulse rounded bg-[color:var(--neon-surface)]/40 md:h-16" />
              <div className="h-12 w-64 animate-pulse rounded bg-[color:var(--neon-surface)]/40 md:h-16" />
            </div>
            <div className="mt-6 h-5 max-w-full animate-pulse rounded bg-[color:var(--neon-surface)]/30 sm:max-w-md" />

            <div className="mt-10 flex items-center gap-3 border-t border-[color:var(--neon-hairline)]/35 pt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-[color:var(--neon-surface)]/35" />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-8 md:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex items-baseline gap-4">
              <div className="h-14 w-16 animate-pulse rounded bg-[color:var(--neon-surface)]/35" />
              <div className="flex flex-col gap-1">
                <div className="h-4 w-24 animate-pulse rounded bg-[color:var(--neon-surface)]/30" />
                <div className="h-3 w-16 animate-pulse rounded bg-[color:var(--neon-surface)]/25" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6 md:ml-10 md:mt-8 md:gap-8">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="events-neon-card flex flex-col overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)]/50 md:flex-row"
                >
                  <div className="aspect-[4/5] w-full animate-pulse bg-[color:var(--neon-surface)]/25 md:aspect-auto md:min-h-[320px] md:w-1/2" />
                  <div className="flex w-full flex-col justify-between p-5 md:w-1/2 md:p-8">
                    <div className="space-y-3">
                      <div className="h-3 w-24 animate-pulse rounded bg-[color:var(--neon-surface)]/30" />
                      <div className="h-8 w-3/4 animate-pulse rounded bg-[color:var(--neon-surface)]/35" />
                      <div className="h-4 w-full animate-pulse rounded bg-[color:var(--neon-surface)]/25" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
