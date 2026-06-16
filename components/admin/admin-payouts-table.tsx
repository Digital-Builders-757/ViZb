import Link from "next/link"

import { AdminPayoutOrderActions } from "@/components/admin/admin-payout-order-actions"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { formatUsdFromCents } from "@/lib/money/usd"
import type { AdminPayoutListRow } from "@/lib/admin/load-admin-payments"

export function AdminPayoutsTable({ payouts }: { payouts: AdminPayoutListRow[] }) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30">
            <tr>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Event</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Organizer</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payout</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Available on</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Block / fail reason</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Transfer</th>
              <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No payouts match these filters.
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-[color:var(--neon-hairline)]/60 last:border-0">
                  <td className="px-4 py-3 align-top font-mono text-xs">{payout.status}</td>
                  <td className="px-4 py-3 align-top">
                    {payout.eventSlug ? (
                      <Link href={`/events/${payout.eventSlug}`} className="underline-offset-4 hover:underline">
                        {payout.eventTitle}
                      </Link>
                    ) : (
                      payout.eventTitle
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{payout.organizerLabel}</td>
                  <td className="px-4 py-3 align-top font-mono">{formatUsdFromCents(payout.organizerPayoutCents)}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {new Date(payout.availableOn).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs text-amber-200">
                    {payout.blockedReason ?? payout.failureReason ?? "—"}
                    {payout.payoutBlocked && payout.payoutBlockedReason ? (
                      <span className="mt-1 block text-muted-foreground">order hold: {payout.payoutBlockedReason}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs">{payout.stripeTransferId ?? "—"}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex min-w-[12rem] flex-col gap-2">
                      <NeonLink href={`/admin/payments/orders/${payout.orderId}`} variant="secondary" size="sm">
                        Order
                      </NeonLink>
                      <AdminPayoutOrderActions
                        orderId={payout.orderId}
                        payoutId={payout.id}
                        payoutBlocked={payout.payoutBlocked}
                        payoutBlockedReason={payout.payoutBlockedReason}
                        payoutReleasedAt={null}
                        releaseEligible={payout.releaseEligible}
                        releaseBlockReason={payout.releaseBlockReason}
                        payoutStatus={payout.status}
                      />
                    </div>
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
