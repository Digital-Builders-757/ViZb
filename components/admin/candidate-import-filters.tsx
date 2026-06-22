"use client"

import { useRouter } from "next/navigation"
import {
  CANDIDATE_DUPLICATE_STATUSES,
  CANDIDATE_REVIEW_STATUSES,
} from "@/lib/imports/types"
import { NeonButton } from "@/components/ui/neon-button"
import type { CandidateQueueFilters } from "@/lib/admin/candidate-queue-params"

export function CandidateImportFilters({
  filters,
  cities,
}: {
  filters: CandidateQueueFilters
  cities: string[]
}) {
  const router = useRouter()

  function apply(formData: FormData) {
    const params = new URLSearchParams()
    const source = String(formData.get("source") ?? "").trim()
    const reviewStatus = String(formData.get("reviewStatus") ?? "").trim()
    const duplicateStatus = String(formData.get("duplicateStatus") ?? "").trim()
    const city = String(formData.get("city") ?? "").trim()
    const startsFrom = String(formData.get("startsFrom") ?? "").trim()
    const startsTo = String(formData.get("startsTo") ?? "").trim()

    if (source) params.set("source", source)
    if (reviewStatus) params.set("reviewStatus", reviewStatus)
    if (duplicateStatus) params.set("duplicateStatus", duplicateStatus)
    if (city) params.set("city", city)
    if (startsFrom) params.set("startsFrom", new Date(startsFrom).toISOString())
    if (startsTo) params.set("startsTo", new Date(startsTo).toISOString())

    const qs = params.toString()
    router.push(qs ? `/admin/events/imports?${qs}` : "/admin/events/imports")
  }

  function clearFilters() {
    router.push("/admin/events/imports?reviewStatus=pending_review")
  }

  const startsFromValue = filters.startsFrom
    ? new Date(filters.startsFrom).toISOString().slice(0, 16)
    : ""
  const startsToValue = filters.startsTo ? new Date(filters.startsTo).toISOString().slice(0, 16) : ""

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        apply(new FormData(event.currentTarget))
      }}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
    >
      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Source</span>
        <select
          name="source"
          defaultValue={filters.sourceKey ?? ""}
          className="w-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        >
          <option value="">All sources</option>
          <option value="ticketmaster">Ticketmaster</option>
          <option value="eventbrite">Eventbrite</option>
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Review status</span>
        <select
          name="reviewStatus"
          defaultValue={filters.reviewStatus ?? ""}
          className="w-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {CANDIDATE_REVIEW_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Duplicate status</span>
        <select
          name="duplicateStatus"
          defaultValue={filters.duplicateStatus ?? ""}
          className="w-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {CANDIDATE_DUPLICATE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">City</span>
        <input
          name="city"
          list="candidate-cities"
          defaultValue={filters.city ?? ""}
          placeholder="Filter by city"
          className="w-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        />
        <datalist id="candidate-cities">
          {cities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Starts from</span>
        <input
          type="datetime-local"
          name="startsFrom"
          defaultValue={startsFromValue}
          className="w-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        />
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Starts to</span>
        <input
          type="datetime-local"
          name="startsTo"
          defaultValue={startsToValue}
          className="w-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap items-end gap-2 xl:col-span-6">
        <NeonButton type="submit" size="sm">
          Apply filters
        </NeonButton>
        <button
          type="button"
          onClick={clearFilters}
          className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-neon-a/30"
        >
          Reset
        </button>
      </div>
    </form>
  )
}
