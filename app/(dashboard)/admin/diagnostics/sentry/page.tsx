import Link from "next/link"
import { Bug } from "lucide-react"

import { SentryDiagnostics } from "@/components/admin/sentry-diagnostics"
import { requireAdmin } from "@/lib/auth-helpers"
import { getSentryReadinessChecks } from "@/lib/sentry/readiness"
import { NeonLink } from "@/components/ui/neon-link"

export default async function SentryDiagnosticsPage() {
  await requireAdmin()

  const { checks, captureEnabled, overallReady } = getSentryReadinessChecks()

  return (
    <div>
      <div className="flex items-center gap-3">
        <Bug className="h-5 w-5 text-neon-b" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon-b">Staff Admin</span>
      </div>
      <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">Sentry monitoring readiness</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Production/main error monitoring only. Preview and develop are intentionally not monitored. Secret values are
        never shown — only presence and environment labels.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <NeonLink href="/admin" variant="secondary" size="sm">
          ← Admin overview
        </NeonLink>
        <Link
          href="/admin/diagnostics/stripe"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Stripe diagnostics
        </Link>
      </div>

      <div className="mt-8">
        <SentryDiagnostics checks={checks} captureEnabled={captureEnabled} overallReady={overallReady} />
      </div>
    </div>
  )
}
