import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import {
  ImportRunStatusBadge,
  ImportTriggerBadge,
  SourceBadge,
} from "@/components/admin/candidate-import-badges"
import {
  type ImportRunRow,
  summarizeImportRun,
} from "@/lib/admin/load-import-runs"

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function ImportRunHistory({
  rows,
  total,
  page,
  pageSize,
  sourceKey,
}: {
  rows: ImportRunRow[]
  total: number
  page: number
  pageSize: number
  sourceKey?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function pageHref(nextPage: number): string {
    const params = new URLSearchParams()
    if (sourceKey) params.set("source", sourceKey)
    if (nextPage > 1) params.set("runPage", String(nextPage))
    const qs = params.toString()
    return qs ? `/admin/events/imports?${qs}` : "/admin/events/imports"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Import history · {total} run{total === 1 ? "" : "s"}
        </p>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <NeonLink
              href={pageHref(page - 1)}
              variant="secondary"
              size="sm"
              className={page <= 1 ? "pointer-events-none opacity-40" : ""}
            >
              ← Prev
            </NeonLink>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <NeonLink
              href={pageHref(page + 1)}
              variant="secondary"
              size="sm"
              className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
            >
              Next →
            </NeonLink>
          </div>
        ) : null}
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Source</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Trigger</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Environment</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Started</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Finished</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Found</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Created</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Updated</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Skipped</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                    No import runs recorded yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const found = row.candidates_found || row.events_found
                  const created = row.candidates_created || row.events_created
                  const updated = row.candidates_updated || row.events_updated
                  const skipped = row.candidates_skipped || row.events_skipped
                  return (
                    <tr key={row.id} className="border-b border-[color:var(--neon-hairline)]/60 last:border-0">
                      <td className="px-4 py-3 align-top">
                        <SourceBadge sourceKey={row.source} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ImportRunStatusBadge status={row.status} skipped={skipped} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ImportTriggerBadge triggerType={row.trigger_type} />
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                        {row.environment ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                        {formatDateTime(row.started_at)}
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                        {formatDateTime(row.finished_at)}
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs">{found}</td>
                      <td className="px-4 py-3 align-top font-mono text-xs">{created}</td>
                      <td className="px-4 py-3 align-top font-mono text-xs">{updated}</td>
                      <td className="px-4 py-3 align-top font-mono text-xs">{skipped}</td>
                      <td className="max-w-[240px] px-4 py-3 align-top text-xs text-muted-foreground">
                        {summarizeImportRun(row)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
