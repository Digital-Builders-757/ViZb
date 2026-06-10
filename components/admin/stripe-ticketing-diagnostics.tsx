import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

import { GlassCard } from "@/components/ui/glass-card"
import {
  getStripeTicketingReadinessChecks,
  type ReadinessCheck,
  type ReadinessCheckStatus,
} from "@/lib/stripe/ticketing-readiness"

function StatusIcon({ status }: { status: ReadinessCheckStatus }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
  if (status === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
  return <XCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
}

function statusLabel(status: ReadinessCheckStatus): string {
  if (status === "pass") return "Pass"
  if (status === "warn") return "Warning"
  return "Fail"
}

function CheckRow({ check }: { check: ReadinessCheck }) {
  return (
    <li className="flex gap-3 rounded-xl border border-[color:var(--neon-hairline)]/80 bg-[color:var(--neon-surface)]/20 px-4 py-3">
      <StatusIcon status={check.status} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-[color:var(--neon-text0)]">{check.label}</span>
          <span
            className={
              check.status === "pass"
                ? "rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-emerald-200"
                : check.status === "warn"
                  ? "rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-200"
                  : "rounded-full border border-red-400/40 bg-red-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-red-200"
            }
          >
            {statusLabel(check.status)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--neon-text1)]">{check.detail}</p>
      </div>
    </li>
  )
}

export function StripeTicketingDiagnostics() {
  const { checks, webhookUrl, overallReady } = getStripeTicketingReadinessChecks()

  return (
    <div className="space-y-6">
      <GlassCard
        className={
          overallReady
            ? "border border-emerald-400/35 bg-emerald-400/5 p-5"
            : "border border-amber-500/35 bg-amber-500/5 p-5"
        }
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Overall</p>
        <p className="mt-2 text-lg font-semibold text-[color:var(--neon-text0)]">
          {overallReady ? "Stripe ticketing looks ready" : "Stripe ticketing is not fully ready"}
        </p>
        <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
          {overallReady
            ? "Core checkout, webhook, and service-role configuration passed. Run a test purchase before a live event."
            : "Fix failed checks below before testing paid tickets on Preview or Production."}
        </p>
      </GlassCard>

      {webhookUrl ? (
        <GlassCard className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Expected Stripe webhook URL
          </p>
          <p className="mt-2 break-all font-mono text-sm text-[color:var(--neon-a)]">{webhookUrl}</p>
          <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
            Register this endpoint in the Stripe Dashboard (or Stripe CLI for local dev) and paste the signing secret
            into <span className="font-mono">STRIPE_WEBHOOK_SECRET</span>.
          </p>
        </GlassCard>
      ) : null}

      <ul className="space-y-3">
        {checks.map((check) => <CheckRow key={check.key} check={check} />)}
      </ul>
    </div>
  )
}
