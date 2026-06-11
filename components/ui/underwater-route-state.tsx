import { AlertTriangle, Loader2 } from "lucide-react"

import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { WaterLoader } from "@/components/ui/water-loader"
import { cn } from "@/lib/utils"

/** Branded inline loading row for route segments. */
export function UnderwaterLoadingRow({
  label = "Loading…",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-4 py-3 backdrop-blur",
        className,
      )}
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[color:var(--neon-a)]" aria-hidden />
      <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text1)]">{label}</span>
    </div>
  )
}

/** Centered loading panel with WaterLoader — for route `loading.tsx` shells. */
export function UnderwaterLoadingPanel({
  title = "Loading",
  description = "Surfacing your view…",
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <GlassCard className={cn("flex flex-col items-center px-6 py-10 text-center md:py-14", className)}>
      <WaterLoader className="h-2 w-48 sm:w-56" />
      <p className="mt-6 font-serif text-lg font-bold text-[color:var(--neon-text0)]">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-[color:var(--neon-text2)]">{description}</p>
    </GlassCard>
  )
}

/** Skeleton block using underwater tokens. */
export function UnderwaterSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[color:var(--neon-surface)]/35 ring-1 ring-[color:var(--neon-hairline)]/40",
        className,
      )}
      aria-hidden
    />
  )
}

export function UnderwaterErrorState({
  title = "Something went wrong",
  description = "We could not load this section. Try again or head back.",
  retryHref,
  retryLabel = "Try again",
}: {
  title?: string
  description?: string
  retryHref?: string
  retryLabel?: string
}) {
  return (
    <EmptyStateCard
      kicker="Error"
      title={title}
      description={description}
      className="border border-amber-500/35"
    >
      <div className="flex items-center gap-2 text-amber-200/90">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        {retryHref ? (
          <NeonLink href={retryHref} variant="secondary" size="sm">
            {retryLabel}
          </NeonLink>
        ) : null}
      </div>
    </EmptyStateCard>
  )
}

/** Re-export for unified empty states. */
export { EmptyStateCard as UnderwaterEmptyState }
