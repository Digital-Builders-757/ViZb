import { Calendar, Heart, Ticket } from "lucide-react"
import type { DashboardHomeStats } from "@/lib/dashboard/dashboard-home-types"
import { StatCard } from "@/components/ui/stat-card"

export function DashboardStats({ stats }: { stats: DashboardHomeStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatCard
        icon={Calendar}
        label="Upcoming plans"
        value={stats.upcomingPlans}
        hint="Locked in"
        accent="a"
        className="rounded-none"
      />
      <StatCard
        icon={Heart}
        label="Saved events"
        value={stats.savedEvents}
        hint="On your radar"
        accent="b"
        className="rounded-none"
      />
      <StatCard
        icon={Ticket}
        label="Tickets"
        value={stats.ticketsPasses}
        hint="Active passes"
        accent="c"
        className="rounded-none"
      />
    </div>
  )
}
