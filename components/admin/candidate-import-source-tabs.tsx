"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { buildCandidateQueueQueryString, type CandidateQueueFilters } from "@/lib/admin/candidate-queue-params"
import type { CandidateSourceOption } from "@/lib/admin/load-candidate-queue"

export function CandidateImportSourceTabs({
  filters,
  sources,
}: {
  filters: CandidateQueueFilters
  sources: CandidateSourceOption[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSource = searchParams.get("source") ?? undefined
  const tabs = [
    { key: undefined, label: "All" },
    ...sources.map((source) => ({ key: source.source_key, label: source.display_name })),
  ]

  function hrefForSource(sourceKey: string | undefined): string {
    const qs = buildCandidateQueueQueryString(filters, {
      sourceKey,
      page: 1,
    })
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = (tab.key ?? undefined) === (activeSource || undefined)
        return (
          <Link
            key={tab.key ?? "all"}
            href={hrefForSource(tab.key)}
            className={`inline-flex min-h-9 items-center border px-3 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              isActive
                ? "border-neon-a/45 bg-neon-a/10 text-foreground"
                : "border-border text-muted-foreground hover:border-neon-a/30 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
      <Link
        href="/admin#event-submissions"
        className="inline-flex min-h-9 items-center border border-border px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-neon-a/30 hover:text-foreground"
      >
        Organizer submissions →
      </Link>
    </div>
  )
}
