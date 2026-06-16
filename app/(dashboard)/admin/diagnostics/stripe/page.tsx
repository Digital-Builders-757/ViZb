import Link from "next/link"
import { CreditCard } from "lucide-react"

import { StripeTicketingDiagnostics } from "@/components/admin/stripe-ticketing-diagnostics"
import { requireAdmin } from "@/lib/auth-helpers"
import { NeonLink } from "@/components/ui/neon-link"

export default async function StripeTicketingDiagnosticsPage() {
  await requireAdmin()

  return (
    <div>
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-neon-b" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon-b">Staff Admin</span>
      </div>
      <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">Stripe ticketing readiness</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Safe pass/fail checks for paid ticket checkout. Secret values are never shown, only presence and public key
        prefixes.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <NeonLink href="/admin" variant="secondary" size="sm">← Admin overview</NeonLink>
        <Link
          href="/admin/revenue"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Ticket revenue
        </Link>
      </div>

      <div className="mt-8">
        <StripeTicketingDiagnostics />
      </div>
    </div>
  )
}
