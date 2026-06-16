import { Suspense } from "react"
import { CreditCard } from "lucide-react"

import { AdminOrdersTable } from "@/components/admin/admin-orders-table"
import { AdminPaymentsFilters } from "@/components/admin/admin-payments-filters"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { requireAdmin } from "@/lib/auth-helpers"
import { loadAdminOrdersList } from "@/lib/admin/load-admin-payments"

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    event?: string
    organizer?: string
    payoutStatus?: string
    paymentStatus?: string
    disputeStatus?: string
  }>
}) {
  await requireAdmin()

  const sp = (await searchParams) ?? {}
  const filters = {
    eventId: sp.event?.trim() || undefined,
    organizerId: sp.organizer?.trim() || undefined,
    payoutStatus: sp.payoutStatus?.trim() || undefined,
    paymentStatus: sp.paymentStatus?.trim() || undefined,
    disputeStatus: sp.disputeStatus?.trim() || undefined,
  }

  const data = await loadAdminOrdersList(filters)

  return (
    <div>
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-neon-b" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon-b">Staff Admin</span>
      </div>
      <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">Payments review</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Audit paid ticket orders with full fee breakdown, refund/dispute state, and payout lifecycle before automated
        release.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <NeonLink href="/admin" variant="secondary" size="sm">
          ← Admin overview
        </NeonLink>
        <NeonLink href="/admin/payments/payouts" size="sm">
          Payout ledger
        </NeonLink>
        <NeonLink href="/admin/revenue" variant="secondary" size="sm">
          Legacy revenue view
        </NeonLink>
      </div>

      {!data.serviceRoleConfigured || data.loadError ? (
        <GlassCard className="mt-8 border border-amber-500/35 p-5">
          <p className="text-sm text-[color:var(--neon-text1)]">
            {data.loadError ?? "Service role is not configured."} Set{" "}
            <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> to load payment records.
          </p>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="mt-8 p-4">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
              <AdminPaymentsFilters
                basePath="/admin/payments"
                options={data.filters}
                values={{
                  event: filters.eventId,
                  organizer: filters.organizerId,
                  payoutStatus: filters.payoutStatus,
                  paymentStatus: filters.paymentStatus,
                  disputeStatus: filters.disputeStatus,
                }}
              />
            </Suspense>
          </GlassCard>

          <div className="mt-6">
            <AdminOrdersTable orders={data.orders} />
          </div>
        </>
      )}
    </div>
  )
}
