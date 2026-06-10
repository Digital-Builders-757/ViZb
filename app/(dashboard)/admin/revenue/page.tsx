import Link from "next/link"
import { DollarSign } from "lucide-react"

import { TicketRevenuePanel } from "@/components/admin/ticket-revenue-panel"
import { requireAdmin } from "@/lib/auth-helpers"
import { loadTicketRevenueData } from "@/lib/admin/load-ticket-revenue"
import { NeonLink } from "@/components/ui/neon-link"

export default async function AdminTicketRevenuePage({
  searchParams,
}: {
  searchParams?: Promise<{ event?: string }>
}) {
  await requireAdmin()

  const sp = (await searchParams) ?? {}
  const eventFilter = sp.event?.trim() || undefined
  const data = await loadTicketRevenueData(eventFilter)

  return (
    <div>
      <div className="flex items-center gap-3">
        <DollarSign className="h-5 w-5 text-neon-b" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon-b">Staff Admin</span>
      </div>
      <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">Ticket revenue</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Paid ticket orders with ticket subtotal and ViZb service fees separated. Pending and failed orders are listed
        separately from completed sales.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <NeonLink href="/admin" variant="secondary" size="sm">← Admin overview</NeonLink>
        <Link
          href="/admin/diagnostics/stripe"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Stripe diagnostics
        </Link>
      </div>

      <div className="mt-8">
        <TicketRevenuePanel data={data} selectedEventId={eventFilter} />
      </div>
    </div>
  )
}
