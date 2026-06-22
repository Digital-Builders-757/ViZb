const SOURCE_LABELS: Record<string, string> = {
  ticketmaster: "Ticketmaster",
  eventbrite: "Eventbrite",
  ics_feed: "ICS Feed",
  url_import: "URL Import",
  organizer_submission: "Organizer",
}

const SOURCE_COLORS: Record<string, string> = {
  ticketmaster: "border-neon-b/40 text-neon-b bg-neon-b/10",
  eventbrite: "border-neon-a/40 text-neon-a bg-neon-a/10",
  default: "border-border text-muted-foreground bg-muted/10",
}

const REVIEW_STATUS_COLORS: Record<string, string> = {
  pending_review: "border-amber-500/40 text-amber-200 bg-amber-500/10",
  needs_changes: "border-orange-500/40 text-orange-200 bg-orange-500/10",
  approved_listing: "border-neon-a/40 text-neon-a bg-neon-a/10",
  rejected: "border-red-500/40 text-red-300 bg-red-500/10",
  suppressed: "border-border text-muted-foreground bg-muted/20",
  stale: "border-border text-muted-foreground bg-muted/10",
  cancelled: "border-border text-muted-foreground bg-muted/10",
  merged: "border-neon-c/40 text-neon-c bg-neon-c/10",
}

const DUPLICATE_STATUS_COLORS: Record<string, string> = {
  none: "border-border text-muted-foreground bg-muted/5",
  likely: "border-amber-500/40 text-amber-200 bg-amber-500/10",
  exact: "border-red-500/40 text-red-300 bg-red-500/10",
}

function badgeClass(colorMap: Record<string, string>, key: string): string {
  return colorMap[key] ?? colorMap.default ?? "border-border text-muted-foreground bg-muted/10"
}

export function SourceBadge({ sourceKey }: { sourceKey: string }) {
  const label = SOURCE_LABELS[sourceKey] ?? sourceKey.replace(/_/g, " ")
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border ${badgeClass(SOURCE_COLORS, sourceKey)}`}
    >
      {label}
    </span>
  )
}

export function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border ${badgeClass(REVIEW_STATUS_COLORS, status)}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

export function DuplicateStatusBadge({ status }: { status: string }) {
  if (status === "none") {
    return <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">—</span>
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border ${badgeClass(DUPLICATE_STATUS_COLORS, status)}`}
    >
      {status}
    </span>
  )
}

export function ImportTriggerBadge({ triggerType }: { triggerType: string | null }) {
  const label = triggerType === "cron" ? "Cron" : triggerType === "manual" ? "Manual" : "Unknown"
  const color =
    triggerType === "cron"
      ? "border-neon-c/40 text-neon-c bg-neon-c/10"
      : "border-neon-a/40 text-neon-a bg-neon-a/10"
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border ${color}`}
    >
      {label}
    </span>
  )
}

export function ImportRunStatusBadge({
  status,
  skipped,
}: {
  status: string
  skipped?: number
}) {
  if (status === "completed" && (skipped ?? 0) > 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border border-amber-500/40 text-amber-200 bg-amber-500/10">
        Completed with skips
      </span>
    )
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border border-neon-a/40 text-neon-a bg-neon-a/10">
        Completed
      </span>
    )
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border border-neon-b/40 text-neon-b bg-neon-b/10">
        Running
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border border-red-500/40 text-red-300 bg-red-500/10">
      Failed
    </span>
  )
}
