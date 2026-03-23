import { Navbar } from "@/components/navbar"

export default function EventsLoading() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 md:pb-16 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Title skeleton */}
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          <div className="mt-6 flex flex-col gap-2">
            <div className="h-12 md:h-16 w-48 bg-muted rounded animate-pulse" />
            <div className="h-12 md:h-16 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-5 w-96 max-w-full bg-muted rounded animate-pulse mt-6" />

          {/* Filter bar skeleton */}
          <div className="flex items-center gap-3 mt-8 md:mt-10">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="border-t border-border" />
      </div>

      <section className="py-12 md:py-20 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Date header skeleton */}
          <div className="flex items-baseline gap-4">
            <div className="h-14 w-16 bg-muted rounded animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>

          {/* Event cards skeleton */}
          <div className="flex flex-col gap-6 md:gap-8 mt-6 md:mt-8 md:ml-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-border flex flex-col md:flex-row overflow-hidden"
              >
                <div className="w-full md:w-1/2 aspect-[4/5] md:aspect-auto md:min-h-[420px] bg-muted animate-pulse" />
                <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-3/4 bg-muted rounded animate-pulse mt-4" />
                    <div className="h-4 w-full bg-muted rounded animate-pulse mt-4" />
                    <div className="h-4 w-2/3 bg-muted rounded animate-pulse mt-2" />
                  </div>
                  <div className="mt-6 md:mt-8 pt-4 border-t border-border">
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
