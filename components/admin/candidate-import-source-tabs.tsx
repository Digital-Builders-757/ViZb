"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { buildCandidateQueueQueryString, type CandidateQueueFilters } from "@/lib/admin/candidate-queue-params"

const SOURCE_TABS = [
  { key: undefined, label: "All" },
  { key: "ticketmaster", label: "Ticketmaster" },
  { key: "eventbrite", label: "Eventbrite" },
] as const

export function CandidateImportSourceTabs({ filters }: { filters: CandidateQueueFilters }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSource = searchParams.get("source") ?? undefined

  function hrefForSource(sourceKey: string | undefined): string {
    const qs = buildCandidateQueueQueryString(filters, {
      sourceKey,
      page: 1,
    })
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SOURCE_TABS.map((tab) => {
        const isActive = (tab.key ?? undefined) === (activeSource || undefined)
        return (
          <Link
            key={tab.label}
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
