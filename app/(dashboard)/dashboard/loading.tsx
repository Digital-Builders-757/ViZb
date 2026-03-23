export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="h-4 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-56 bg-muted rounded mb-2" />
      <div className="h-4 w-40 bg-muted rounded" />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border p-5 card-accent-cyan">
            <div className="h-3 w-16 bg-muted rounded mb-3" />
            <div className="h-7 w-10 bg-muted rounded mb-1" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="mt-10 space-y-4">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-56 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
