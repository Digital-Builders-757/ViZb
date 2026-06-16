import type { ReactNode } from "react"
import { EmptyStateCard } from "@/components/ui/empty-state-card"

export interface DashboardEmptyStateProps {
  kicker: string
  title: string
  description: string
  children?: ReactNode
}

export function DashboardEmptyState({
  kicker,
  title,
  description,
  children,
}: DashboardEmptyStateProps) {
  return (
    <EmptyStateCard kicker={kicker} title={title} description={description} className="rounded-none">
      {children}
    </EmptyStateCard>
  )
}
