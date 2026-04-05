import { CalendarDays, Compass } from "lucide-react"

import { NeonLink } from "@/components/ui/neon-link"

export function MemberHomeQuickActions() {
  return (
    <section aria-label="Quick actions" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <NeonLink href="/events" fullWidth className="sm:min-w-[min(100%,12rem)] sm:flex-1" shape="xl">
        <Compass className="h-4 w-4 shrink-0" aria-hidden />
        Browse events
      </NeonLink>
      <NeonLink
        href="/dashboard/tickets"
        variant="secondary"
        fullWidth
        className="sm:min-w-[min(100%,12rem)] sm:flex-1"
        shape="xl"
      >
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
        View tickets
      </NeonLink>
    </section>
  )
}
