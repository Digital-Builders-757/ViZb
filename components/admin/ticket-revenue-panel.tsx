import Link from "next/link"

import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { formatUsdFromCents } from "@/lib/money/usd"
import type { TicketRevenueData } from "@/lib/admin/load-ticket-revenue"

function statusClasses(status: string): string {
  if (status === "completed") {
    return "border-emerald-400/45 bg-emerald-400/12 text-emerald-100"
  }
  if (status === "pending_payment") {
    return "border-amber-400/45 bg-amber-400/12 text-amber-100"
  }
  if (status === "refunded") {
    return "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 text-[color:var(--neon-text2)]"
  }
  return "border-red-400/35 bg-red-400/10 text-red-200"
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ")
}

export function TicketRevenuePanel({
  data,
  selectedEventId,
}: {
  data: TicketRevenueData
  selectedEventId?: string
}) {
  const { orders, totals, events, serviceRoleConfigured, loadError } = data

  if (!serviceRoleConfigured) {
    return (
      <GlassCard className="border border-amber-500/35 p-5">
        <p className="text-sm text-[color:var(--neon-text1)]">
          {loadError ?? "Service role is not configured."} Set{" "}
          <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> on the server, then check{" "}
          <NeonLink href="/admin/diagnostics/stripe" variant="secondary" size="sm" className="inline-flex">
            Stripe diagnostics
          </NeonLink>.
        </p>
      </GlassCard>
    )
  }

  if (loadError) {
    return (
      <GlassCard className="border border-red-400/35 p-5">
        <p className="text-sm text-red-200">Could not load orders: {loadError}</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Ticket revenue (completed)
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-[color:var(--neon-text0)]">
            {formatUsdFromCents(totals.grossSubtotalCents)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            ViZb service fees
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-neon-a">
            {formatUsdFromCents(totals.grossPlatformFeeCents)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Total collected
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-[color:var(--neon-text0)]">
            {formatUsdFromCents(totals.grossTotalCents)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Order counts</p>
          <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
            <span className="font-mono text-[color:var(--neon-text0)]">{totals.completedCount}</span> completed
          </p>
          <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
            <span className="font-mono text-amber-200">{totals.pendingCount}</span> pending
            <span className="mx-2 text-[color:var(--neon-text2)]">·</span>
            <span className="font-mono text-red-200">{totals.failedCount}</span> cancelled/failed/expired
          </p>
        </GlassCard>
      </div>

      {events.length > 0 ? (
        <GlassCard className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Filter by event</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <NeonLink
              href="/admin/revenue"
              variant={selectedEventId ? "secondary" : "primary"}
              size="sm"
            >
              All events
            </NeonLink>
            {events.map((ev) => (
              <NeonLink
                key={ev.id}
                href={`/admin/revenue?event=${ev.id}`}
                variant={selectedEventId === ev.id ? "primary" : "secondary"}
                size="sm"
              >
                {ev.title}
              </NeonLink>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Event
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Buyer
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Tier
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Status
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Ticket
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  ViZb fee
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Total
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Stripe
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[color:var(--neon-text2)]">
                    No paid ticket orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-[color:var(--neon-hairline)]/60 last:border-0">
                    <td className="px-4 py-3 align-top">
                      {o.eventSlug ? (
                        <Link
                          href={`/events/${o.eventSlug}`}
                          className="font-medium text-[color:var(--neon-text0)] underline-offset-4 hover:underline"
                        >
                          {o.eventTitle}
                        </Link>
                      ) : (
                        <span className="text-[color:var(--neon-text0)]">{o.eventTitle}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-[color:var(--neon-text1)]">{o.buyerLabel}</td>
                    <td className="px-4 py-3 align-top text-[color:var(--neon-text1)]">{o.tierName}</td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${statusClasses(o.status)}`}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[color:var(--neon-text0)]">
                      {formatUsdFromCents(o.subtotalCents)}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-neon-a">
                      {formatUsdFromCents(o.platformFeeCents)}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[color:var(--neon-text0)]">
                      {formatUsdFromCents(o.totalCents)}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[10px] text-[color:var(--neon-text2)]">
                      {o.stripeCheckoutSessionId ? (
                        <span className="block max-w-[8rem] truncate" title={o.stripeCheckoutSessionId}>
                          {o.stripeCheckoutSessionId}
                        </span>
                      ) : (
                        "—"
                      )}
                      {o.stripePaymentIntentId ? (
                        <span className="mt-1 block max-w-[8rem] truncate" title={o.stripePaymentIntentId}>
                          {o.stripePaymentIntentId}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top text-[color:var(--neon-text2)]">
                      {new Date(o.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <p className="text-xs text-[color:var(--neon-text2)]">
        Not a payout ledger — totals reflect completed orders in ViZb. Stripe processing fees are not included unless
        stored separately.
      </p>
    </div>
  )
}
