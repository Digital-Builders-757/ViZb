import { notFound } from "next/navigation"
import { ReceiptText } from "lucide-react"

import { AdminOrderDetailPanel } from "@/components/admin/admin-order-detail-panel"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { requireAdmin } from "@/lib/auth-helpers"
import { loadAdminOrderDetail } from "@/lib/admin/load-admin-payments"

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()

  const { id } = await params
  const data = await loadAdminOrderDetail(id)

  if (!data.serviceRoleConfigured) {
    return (
      <GlassCard className="border border-amber-500/35 p-5">
        <p className="text-sm text-[color:var(--neon-text1)]">Service role is not configured on the server.</p>
      </GlassCard>
    )
  }

  if (data.loadError) {
    return (
      <GlassCard className="border border-red-400/35 p-5">
        <p className="text-sm text-red-200">Could not load order: {data.loadError}</p>
      </GlassCard>
    )
  }

  if (!data.order) {
    notFound()
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <ReceiptText className="h-5 w-5 text-neon-a" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon-a">Staff Admin</span>
      </div>
      <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">Order payment review</h1>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{data.order.id}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <NeonLink href="/admin/payments" variant="secondary" size="sm">
          ← All orders
        </NeonLink>
        <NeonLink href="/admin/payments/payouts" variant="secondary" size="sm">
          Payout ledger
        </NeonLink>
      </div>

      <div className="mt-8">
        <AdminOrderDetailPanel order={data.order} />
      </div>
    </div>
  )
}
