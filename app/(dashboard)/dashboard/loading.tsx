import { UnderwaterLoadingPanel, UnderwaterSkeleton } from "@/components/ui/underwater-route-state"

export default function DashboardLoading() {
  return (
    <div className="space-y-10 md:space-y-12">
      <UnderwaterLoadingPanel title="Command center" description="Loading your plans, passes, and pulse…" />
      <UnderwaterSkeleton className="h-44 w-full rounded-none" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <UnderwaterSkeleton key={i} className="h-28 rounded-none" />
        ))}
      </div>
      <UnderwaterSkeleton className="h-32 w-full rounded-none" />
      <UnderwaterSkeleton className="min-h-[420px] w-full rounded-none" />
      <UnderwaterSkeleton className="h-44 w-full rounded-none" />
      <UnderwaterSkeleton className="h-40 w-full rounded-none" />
      <UnderwaterSkeleton className="h-36 w-full rounded-none" />
      <UnderwaterSkeleton className="h-48 w-full rounded-none" />
    </div>
  )
}
