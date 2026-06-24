import { GlassCard } from "@/components/ui/glass-card"
import { SourceBadge } from "@/components/admin/candidate-import-badges"
import type { EventSourceListItem } from "@/lib/imports/source-readiness"

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function ImportSourceHealth({ sources }: { sources: EventSourceListItem[] }) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No registered import sources available.</p>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sources.map((source) => {
        const env = source.env_readiness
        return (
          <GlassCard key={source.source_key} className="border border-[color:var(--neon-hairline)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <SourceBadge sourceKey={source.source_key} />
                <p className="mt-2 font-semibold text-foreground">{source.display_name}</p>
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest ${
                  source.enabled_in_db ? "text-neon-a" : "text-muted-foreground"
                }`}
              >
                DB gate {source.enabled_in_db ? "on" : "off"}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Env ready</dt>
                <dd className="mt-1 text-foreground">
                  {env?.ready ? "Yes" : env?.code ?? "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Run failures</dt>
                <dd className="mt-1 text-foreground">{source.consecutive_failures}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last success</dt>
                <dd className="mt-1 text-muted-foreground">{formatDateTime(source.last_success_at)}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last failure</dt>
                <dd className="mt-1 text-muted-foreground">{formatDateTime(source.last_failure_at)}</dd>
              </div>
            </dl>

            {source.last_error_summary ? (
              <p className="mt-3 text-xs text-amber-200">{source.last_error_summary}</p>
            ) : null}
            {env?.message && !env.ready ? (
              <p className="mt-2 text-xs text-muted-foreground">{env.message}</p>
            ) : null}
          </GlassCard>
        )
      })}
    </div>
  )
}
