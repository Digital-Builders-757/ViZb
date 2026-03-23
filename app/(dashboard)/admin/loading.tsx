export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
      <div className="h-8 w-48 bg-muted rounded mb-2" />
      <div className="h-4 w-64 bg-muted rounded" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border p-5">
            <div className="h-3 w-16 bg-muted rounded mb-3" />
            <div className="h-7 w-10 bg-muted rounded mb-1" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Applications section */}
      <div className="mt-10 space-y-4">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-6 w-40 bg-muted rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-border p-6">
            <div className="h-4 w-48 bg-muted rounded mb-3" />
            <div className="h-3 w-full bg-muted rounded mb-2" />
            <div className="h-3 w-3/4 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
