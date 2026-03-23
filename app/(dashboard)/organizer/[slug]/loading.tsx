export default function OrganizerLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          <div className="h-7 w-48 bg-muted rounded animate-pulse mt-2" />
          <div className="flex items-center gap-3 mt-2">
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-12 w-40 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-8 md:mt-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-12 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      {/* Events list skeleton */}
      <div className="mt-10">
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        <div className="h-6 w-32 bg-muted rounded animate-pulse mt-2" />
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border p-4 md:p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                <div className="h-3 w-64 bg-muted rounded animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
