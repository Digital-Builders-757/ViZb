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
    color: "text-brand-blue-mid border-brand-blue-mid/30 bg-brand-blue-mid/5",
    icon: Clock,
  },
  published: {
    label: "Published",
    color: "text-brand-cyan border-brand-cyan/30 bg-brand-cyan/5",
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
