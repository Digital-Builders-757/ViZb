import { Suspense } from "react"
import { Landmark } from "lucide-react"

import { AdminPaymentsFilters } from "@/components/admin/admin-payments-filters"
import { AdminPayoutsTable } from "@/components/admin/admin-payouts-table"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { requireAdmin } from "@/lib/auth-helpers"
import { loadAdminPayoutsList } from "@/lib/admin/load-admin-payments"

export default async function AdminPayoutsPage({
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

  const data = await loadAdminPayoutsList(filters)

  return (
    <div>
      <div className="flex items-center gap-3">
        <Landmark className="h-5 w-5 text-neon-c" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon-c">Staff Admin</span>
      </div>
      <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">Organizer payouts</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Pending, blocked, released, and failed payout records with manual hold and release controls for MVP operations.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <NeonLink href="/admin/payments" variant="secondary" size="sm">
          ← Orders
        </NeonLink>
        <NeonLink href="/admin" variant="secondary" size="sm">
          Admin overview
        </NeonLink>
      </div>

      {!data.serviceRoleConfigured || data.loadError ? (
        <GlassCard className="mt-8 border border-amber-500/35 p-5">
          <p className="text-sm text-[color:var(--neon-text1)]">
            {data.loadError ?? "Service role is not configured."}
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <GlassCard className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pending</p>
              <p className="mt-2 font-mono text-2xl font-bold">{data.counts.pending}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Blocked</p>
              <p className="mt-2 font-mono text-2xl font-bold text-amber-200">{data.counts.blocked}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Released</p>
              <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">{data.counts.released}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Failed</p>
              <p className="mt-2 font-mono text-2xl font-bold text-red-200">{data.counts.failed}</p>
            </GlassCard>
          </div>

          <GlassCard className="mt-6 p-4">
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
              <AdminPaymentsFilters
                basePath="/admin/payments/payouts"
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
            <AdminPayoutsTable payouts={data.payouts} />
          </div>
        </>
      )}
    </div>
  )
}
