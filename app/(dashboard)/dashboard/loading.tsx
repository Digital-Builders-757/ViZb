import { UnderwaterLoadingPanel, UnderwaterSkeleton } from "@/components/ui/underwater-route-state"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <UnderwaterLoadingPanel title="Dashboard" description="Loading your events and tickets…" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <UnderwaterSkeleton key={i} className="h-28" />
        ))}
      </div>
      <UnderwaterSkeleton className="h-40 w-full" />
    </div>
  )
}
