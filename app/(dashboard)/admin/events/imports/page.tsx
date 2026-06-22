import Link from "next/link"
import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth-helpers"
import { fetchImportedEventQueue } from "@/app/actions/event-import"
import { EventImportQueue } from "@/components/admin/event-import-queue"
import { CandidateImportQueue } from "@/components/admin/candidate-import-queue"
import { CandidateImportSourceTabs } from "@/components/admin/candidate-import-source-tabs"
import { CandidateImportFilters } from "@/components/admin/candidate-import-filters"
import { ImportRunControls } from "@/components/admin/import-run-controls"
import { ImportRunHistory } from "@/components/admin/import-run-history"
import { ImportSourceHealth } from "@/components/admin/import-source-health"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import {
  loadCandidateQueue,
  loadCandidateQueueCities,
  type CandidateQueueSearchParams,
} from "@/lib/admin/load-candidate-queue"
import { loadImportRunHistory } from "@/lib/admin/load-import-runs"
import { loadSourceHealthPanel } from "@/lib/admin/load-source-health"

type PageSearchParams = CandidateQueueSearchParams & {
  runPage?: string
}

function withDefaultReviewStatus(params: PageSearchParams): CandidateQueueSearchParams {
  if (params.reviewStatus !== undefined) return params
  return { ...params, reviewStatus: "pending_review" }
}

export default async function AdminEventImportsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>
}) {
  const { supabase } = await requireAdmin()
  const rawParams = (await searchParams) ?? {}
  const sp = withDefaultReviewStatus(rawParams)
  const runPage = rawParams.runPage

  const [candidateQueue, legacyQueue, citiesResult, importRuns, sourceHealth] = await Promise.all([
    loadCandidateQueue(supabase, sp),
    fetchImportedEventQueue(),
    loadCandidateQueueCities(supabase),
    loadImportRunHistory(supabase, {
      source: sp.source,
      page: runPage,
      pageSize: sp.pageSize,
    }),
    loadSourceHealthPanel(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-neon-a"
        >
          ← Admin
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-bold text-foreground md:text-3xl">Event Import Review</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review imported events before they appear publicly on ViZb. Approve or reject legacy Eventbrite rows, and
          moderate Ticketmaster and other source candidates from the shared queue.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <NeonLink href="/admin#event-submissions" variant="secondary" shape="xl" className="sm:w-auto">
            Organizer review queue
          </NeonLink>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Manual import</h2>
        <ImportRunControls />
      </section>

      {sourceHealth.serviceRoleConfigured ? (
        <section className="space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Source health</h2>
          {sourceHealth.error ? (
            <p className="text-sm text-destructive">{sourceHealth.error}</p>
          ) : (
            <ImportSourceHealth sources={sourceHealth.sources} />
          )}
        </section>
      ) : (
        <GlassCard className="border border-amber-500/35 p-5">
          <p className="text-sm text-muted-foreground">
            Set <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> to load source health and run manual
            imports.
          </p>
        </GlassCard>
      )}

      <section className="space-y-4">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading source tabs…</p>}>
          <CandidateImportSourceTabs filters={candidateQueue.filters} />
        </Suspense>

        <GlassCard className="p-4">
          <CandidateImportFilters filters={candidateQueue.filters} cities={citiesResult.cities} />
        </GlassCard>

        {candidateQueue.error ? (
          <p className="text-sm text-destructive">Failed to load candidate queue: {candidateQueue.error}</p>
        ) : (
          <CandidateImportQueue
            rows={candidateQueue.rows}
            total={candidateQueue.total}
            page={candidateQueue.page}
            pageSize={candidateQueue.pageSize}
            filters={candidateQueue.filters}
          />
        )}
      </section>

      {legacyQueue.events.length > 0 ? (
        <section className="space-y-4 border-t border-border pt-8">
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground">Legacy Eventbrite (pre-#266)</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              These rows live directly on <span className="font-mono">events</span>. Approve publishes them immediately.
              New imports use the candidate queue above.
            </p>
          </div>
          {legacyQueue.error ? (
            <p className="text-sm text-destructive">{legacyQueue.error}</p>
          ) : (
            <EventImportQueue events={legacyQueue.events} showRunImport={false} />
          )}
        </section>
      ) : null}

      <section className="space-y-3 border-t border-border pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Import history</h2>
        {importRuns.error ? (
          <p className="text-sm text-destructive">{importRuns.error}</p>
        ) : (
          <ImportRunHistory
            rows={importRuns.rows}
            total={importRuns.total}
            page={importRuns.page}
            pageSize={importRuns.pageSize}
            sourceKey={importRuns.sourceKey}
          />
        )}
      </section>
    </div>
  )
}
