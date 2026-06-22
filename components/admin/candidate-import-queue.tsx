"use client"

import Link from "next/link"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { normalizeCategories } from "@/lib/events/categories"
import type { CandidateQueueRow } from "@/lib/admin/load-candidate-queue"
import {
  buildCandidateQueueQueryString,
  type CandidateQueueFilters,
} from "@/lib/admin/candidate-queue-params"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import {
  DuplicateStatusBadge,
  ReviewStatusBadge,
  SourceBadge,
} from "@/components/admin/candidate-import-badges"

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function CandidateImportQueue({
  rows,
  total,
  page,
  pageSize,
  filters,
}: {
  rows: CandidateQueueRow[]
  total: number
  page: number
  pageSize: number
  filters: CandidateQueueFilters
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function pageHref(nextPage: number): string {
    const qs = buildCandidateQueueQueryString(filters, { page: nextPage })
    return qs ? `/admin/events/imports?${qs}` : "/admin/events/imports"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No imported candidates match these filters."
            : `Showing ${from}–${to} of ${total} candidate${total === 1 ? "" : "s"}.`}
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
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Source
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Start
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Venue / City
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Review
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Duplicate
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Last imported
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Source ID
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    Queue empty for current filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const cats = normalizeCategories(row.categories)
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[color:var(--neon-hairline)]/60 last:border-0 hover:bg-[color:var(--neon-surface)]/20"
                    >
                      <td className="max-w-[220px] px-4 py-3 align-top">
                        <Link
                          href={`/admin/events/imports/candidates/${row.id}`}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <SourceBadge sourceKey={row.source_key} />
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                        {formatDateTime(row.starts_at)}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        {[row.venue_name, row.city].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {cats.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                            >
                              {formatCategoryLabel(c)}
                            </span>
                          ))}
                          {cats.length > 2 ? (
                            <span className="font-mono text-[10px] text-muted-foreground">+{cats.length - 2}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ReviewStatusBadge status={row.review_status} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <DuplicateStatusBadge status={row.duplicate_status} />
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                        {formatDateTime(row.last_imported_at)}
                      </td>
                      <td className="max-w-[120px] truncate px-4 py-3 align-top font-mono text-[10px] text-muted-foreground">
                        {row.source_event_id}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <NeonLink href={`/admin/events/imports/candidates/${row.id}`} variant="secondary" size="sm">
                          Open
                        </NeonLink>
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
