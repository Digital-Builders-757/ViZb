import { CheckCircle2, Clock, FileText, XCircle, Archive } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface StatusConfig {
  label: string
  color: string
  icon: LucideIcon
}

/**
 * Shared status badge configuration for events.
 * Used on organizer dashboard and event detail pages.
 */
export const EVENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    color: "text-muted-foreground border-muted-foreground/30",
    icon: FileText,
  },
  pending_review: {
    label: "In Review",
    color: "text-neon-b border-neon-b/30 bg-neon-b/5",
    icon: Clock,
  },
  published: {
    label: "Published",
    color: "text-neon-a border-neon-a/30 bg-neon-a/5",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-amber-500 border-amber-500/30 bg-amber-500/5",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    color: "text-muted-foreground border-muted-foreground/25 bg-muted/5",
    icon: Archive,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-destructive border-destructive/30 bg-destructive/5",
    icon: Clock,
  },
}
