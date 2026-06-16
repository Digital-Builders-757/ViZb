"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle2, CircleAlert, ExternalLink, RefreshCw } from "lucide-react"

import {
  createOrganizerStripeAccountLink,
  createOrganizerStripeExpressAccount,
  refreshOrganizerStripeConnectStatus,
  type OrganizerStripeConnectStatus,
} from "@/app/actions/organizer-stripe-connect"
import { NeonButton } from "@/components/ui/neon-button"
import { GlassCard } from "@/components/ui/glass-card"

function StatusRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${enabled ? "text-emerald-400" : "text-amber-300"}`}>
        {enabled ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden />}
        {enabled ? "Yes" : "No"}
      </span>
    </div>
  )
}

export function OrganizerStripeConnectPanel({
  orgSlug,
  initialStatus,
  connectBanner,
}: {
  orgSlug: string
  initialStatus: OrganizerStripeConnectStatus
  connectBanner?: "return" | "refresh" | null
}) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  const payoutReady = status.payoutReady

  function refreshStatus() {
    startTransition(async () => {
      const result = await refreshOrganizerStripeConnectStatus(orgSlug)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.status) {
        setStatus(result.status)
        toast.success("Stripe account status refreshed.")
      }
    })
  }

  function startOnboarding() {
    startTransition(async () => {
      const created = await createOrganizerStripeExpressAccount(orgSlug)
      if (created.error) {
        toast.error(created.error)
        return
      }

      const link = await createOrganizerStripeAccountLink(orgSlug)
      if (link.error) {
        toast.error(link.error)
        return
      }
      if (link.url) {
        window.location.href = link.url
      }
    })
  }

  function finishOnboarding() {
    startTransition(async () => {
      const link = await createOrganizerStripeAccountLink(orgSlug)
      if (link.error) {
        toast.error(link.error)
        return
      }
      if (link.url) {
        window.location.href = link.url
      }
    })
  }

  return (
    <GlassCard className="p-6" emphasis>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Stripe Connect
          </span>
          <h2 className="mt-2 text-lg font-bold text-foreground">Payout account</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Connect Stripe Express to receive ticket face-value payouts. Paid ticket sales stay disabled
            until Stripe confirms payouts are enabled. Free RSVP events work without Connect.
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${
            payoutReady
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
              : "border-amber-400/35 bg-amber-400/10 text-amber-100"
          }`}
        >
          {payoutReady ? "Payout ready" : "Setup required"}
        </span>
      </div>

      {connectBanner === "return" ? (
        <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
          Welcome back from Stripe. Refresh status below to confirm payouts are enabled.
        </p>
      ) : null}
      {connectBanner === "refresh" ? (
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          Your Stripe session expired. Continue onboarding to finish setup.
        </p>
      ) : null}

      <div className="mt-5 space-y-2 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 p-4">
        <StatusRow label="Details submitted" enabled={status.detailsSubmitted} />
        <StatusRow label="Charges enabled" enabled={status.chargesEnabled} />
        <StatusRow label="Payouts enabled" enabled={status.payoutsEnabled} />
        <div className="flex items-center justify-between gap-4 border-t border-[color:var(--neon-hairline)] pt-2 text-sm">
          <span className="text-muted-foreground">Onboarding status</span>
          <span className="font-mono text-xs uppercase tracking-wider text-foreground">
            {status.onboardingStatus.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {!status.stripeAccountId ? (
          <NeonButton type="button" disabled={isPending} onClick={startOnboarding}>
            Connect Stripe
          </NeonButton>
        ) : !payoutReady ? (
          <NeonButton type="button" disabled={isPending} onClick={finishOnboarding}>
            Finish onboarding
          </NeonButton>
        ) : null}

        <NeonButton type="button" variant="secondary" disabled={isPending} onClick={refreshStatus}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Refresh status
        </NeonButton>

        {status.stripeAccountId ? (
          <p className="flex items-center text-xs text-muted-foreground sm:ml-auto">
            <ExternalLink className="mr-1 h-3.5 w-3.5" aria-hidden />
            Account ending …{status.stripeAccountId.slice(-6)}
          </p>
        ) : null}
      </div>
    </GlassCard>
  )
}
