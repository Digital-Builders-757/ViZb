"use client"

import { useState, useTransition } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

import { triggerSentryServerTestError } from "@/app/actions/sentry-diagnostics"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import type { ReadinessCheck, ReadinessCheckStatus } from "@/lib/sentry/readiness"

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

type SentryDiagnosticsProps = {
  checks: ReadinessCheck[]
  captureEnabled: boolean
  overallReady: boolean
}

export function SentryDiagnostics({ checks, captureEnabled, overallReady }: SentryDiagnosticsProps) {
  const [clientResult, setClientResult] = useState<string | null>(null)
  const [serverResult, setServerResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClientTest() {
    setClientResult(null)
    const error = new Error("ViZb Sentry client test (admin diagnostics)")
    Sentry.captureException(error)
    setClientResult(error.message)
  }

  function handleServerTest() {
    setServerResult(null)
    startTransition(async () => {
      try {
        await triggerSentryServerTestError()
        setServerResult("Server action returned without throwing — unexpected.")
      } catch (error) {
        setServerResult(error instanceof Error ? error.message : "Server test error thrown.")
      }
    })
  }

  return (
    <div className="space-y-6">
      <GlassCard
        className={
          overallReady
            ? "border border-emerald-400/35 bg-emerald-400/5 p-5"
            : captureEnabled
              ? "border border-amber-500/35 bg-amber-500/5 p-5"
              : "border border-[color:var(--neon-hairline)]/80 p-5"
        }
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Overall</p>
        <p className="mt-2 text-lg font-semibold text-[color:var(--neon-text0)]">
          {overallReady
            ? "Sentry is active on this deployment"
            : captureEnabled
              ? "Sentry capture is enabled — add auth token for source maps"
              : "Sentry capture is disabled on this deployment"}
        </p>
        <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
          {overallReady
            ? "Production DSNs and build upload token are configured. Use the test buttons below after deploy, then resolve test issues in Sentry."
            : captureEnabled
              ? "Runtime capture is on, but SENTRY_AUTH_TOKEN is missing so production stack traces may be minified."
              : "Expected on Preview, develop, and local dev. Configure SENTRY_* vars on Vercel Production only."}
        </p>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          Configuration checks
        </p>
        <ul className="mt-4 space-y-3">
          {checks.map((check) => (
            <CheckRow key={check.key} check={check} />
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          Production verification (staff only)
        </p>
        <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
          Trigger intentional test errors after deploying to Production/main. Confirm both events appear in the Sentry
          project, then resolve or ignore them. Do not expose this page to non-admin users.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={handleClientTest} disabled={!captureEnabled}>
            Trigger client test error
          </Button>
          <Button type="button" variant="secondary" onClick={handleServerTest} disabled={!captureEnabled || isPending}>
            {isPending ? "Triggering…" : "Trigger server test error"}
          </Button>
        </div>
        {clientResult ? (
          <p className="mt-3 font-mono text-xs text-[color:var(--neon-text1)]">Client: {clientResult}</p>
        ) : null}
        {serverResult ? (
          <p className="mt-2 font-mono text-xs text-[color:var(--neon-text1)]">Server: {serverResult}</p>
        ) : null}
      </GlassCard>
    </div>
  )
}
