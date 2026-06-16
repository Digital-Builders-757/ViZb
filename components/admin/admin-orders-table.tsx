import Link from "next/link"

import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { formatUsdFromCents } from "@/lib/money/usd"
import type { AdminOrderListRow } from "@/lib/admin/load-admin-payments"

export function AdminOrdersTable({ orders }: { orders: AdminOrderListRow[] }) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30">
            <tr>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Event</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Buyer</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Organizer</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Ticket</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">ViZb fee</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Buyer total</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Organizer payout</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payment</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payout</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Refund / dispute</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Review</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                  No paid orders match these filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-[color:var(--neon-hairline)]/60 last:border-0">
                  <td className="px-4 py-3 align-top">
                    {order.eventSlug ? (
                      <Link href={`/events/${order.eventSlug}`} className="font-medium underline-offset-4 hover:underline">
                        {order.eventTitle}
                      </Link>
                    ) : (
                      order.eventTitle
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{order.buyerLabel}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{order.organizerLabel}</td>
                  <td className="px-4 py-3 align-top font-mono">{formatUsdFromCents(order.ticketSubtotalCents)}</td>
                  <td className="px-4 py-3 align-top font-mono text-neon-a">{formatUsdFromCents(order.vizbServiceFeeCents)}</td>
                  <td className="px-4 py-3 align-top font-mono">{formatUsdFromCents(order.buyerTotalCents)}</td>
                  <td className="px-4 py-3 align-top font-mono">{formatUsdFromCents(order.organizerPayoutCents)}</td>
                  <td className="px-4 py-3 align-top font-mono text-xs">{order.paymentStatus}</td>
                  <td className="px-4 py-3 align-top font-mono text-xs">
                    {order.payoutStatus}
                    {order.payoutBlocked ? (
                      <span className="mt-1 block text-amber-200">hold: {order.payoutBlockedReason ?? "manual"}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs">
                    {order.refundStatus}
                    <span className="block">{order.disputeStatus}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <NeonLink href={`/admin/payments/orders/${order.id}`} variant="secondary" size="sm">
                      Open
                    </NeonLink>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
