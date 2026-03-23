export default function ProfileLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-20 bg-muted rounded mb-3" />
      <div className="h-8 w-32 bg-muted rounded" />

      {/* Identity card skeleton */}
      <div className="mt-8 border border-border p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="h-3 w-56 bg-muted rounded" />
        </div>
        <div className="h-5 w-16 bg-muted rounded" />
      </div>

      {/* Form skeleton */}
      <div className="mt-8 form-card p-6 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-10 w-full bg-muted/50 rounded" />
          </div>
        ))}
        <div className="h-10 w-32 bg-muted rounded" />
      </div>
    </div>
  )
}
