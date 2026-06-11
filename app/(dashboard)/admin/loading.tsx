import { UnderwaterLoadingPanel, UnderwaterSkeleton } from "@/components/ui/underwater-route-state"

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <UnderwaterLoadingPanel title="Admin" description="Loading platform overview…" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <UnderwaterSkeleton key={i} className="h-28" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <UnderwaterSkeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  )
}
