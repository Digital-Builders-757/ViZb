"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ImportSummary = {
  sourceLabel: string
  message: string
  isError: boolean
}

type ImportApiResponse = {
  ok?: boolean
  skipped?: boolean
  reason?: string
  found?: number
  created?: number
  updated?: number
  skippedRecords?: number
  skippedEvents?: number
  errors?: string[]
  error?: string
}

function formatImportResponse(sourceLabel: string, data: ImportApiResponse, resOk: boolean): ImportSummary {
  if (!resOk || data.error) {
    return { sourceLabel, message: data.error ?? "Import failed.", isError: true }
  }
  if (data.skipped) {
    const reason = data.reason ? ` (${data.reason})` : ""
    return { sourceLabel, message: `Import skipped${reason}.`, isError: false }
  }
  if (data.reason === "overlap_in_progress") {
    return { sourceLabel, message: "Another import is already running for this source.", isError: true }
  }
  const skipped = data.skippedRecords ?? data.skippedEvents ?? 0
  return {
    sourceLabel,
    message: `Found ${data.found ?? 0} · created ${data.created ?? 0} · updated ${data.updated ?? 0} · skipped ${skipped}`,
    isError: Boolean(data.errors?.length),
  }
}

function ImportRunButton({
  sourceKey,
  sourceLabel,
  endpoint,
  onComplete,
}: {
  sourceKey: string
  sourceLabel: string
  endpoint: string
  onComplete: (summary: ImportSummary) => void
}) {
  const [pending, setPending] = useState(false)

  async function runImport() {
    setPending(true)
    try {
      const res = await fetch(endpoint, { method: "POST" })
      const data = (await res.json()) as ImportApiResponse
      onComplete(formatImportResponse(sourceLabel, data, res.ok))
      window.location.reload()
    } catch {
      onComplete({ sourceLabel, message: "Import request failed.", isError: true })
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={pending}
          data-source={sourceKey}
          className="inline-flex min-h-10 items-center gap-2 border border-border px-4 font-mono text-[10px] uppercase tracking-widest hover:border-neon-a/45 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} aria-hidden />
          Run {sourceLabel} import
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-foreground">
            Run {sourceLabel} import?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
            This starts a manual import for {sourceLabel} only. Candidates land in the review queue — nothing is
            published automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={runImport}
            className="border border-neon-a/45 bg-neon-a/10 font-mono text-xs uppercase tracking-widest"
          >
            Run import
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ImportRunControls() {
  const [summaries, setSummaries] = useState<ImportSummary[]>([])

  function handleComplete(summary: ImportSummary) {
    setSummaries((prev) => [summary, ...prev].slice(0, 4))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <ImportRunButton
          sourceKey="ticketmaster"
          sourceLabel="Ticketmaster"
          endpoint="/api/admin/imports/ticketmaster/run"
          onComplete={handleComplete}
        />
        <ImportRunButton
          sourceKey="eventbrite"
          sourceLabel="Eventbrite"
          endpoint="/api/admin/imports/eventbrite/run"
          onComplete={handleComplete}
        />
      </div>
      {summaries.map((summary) => (
        <p
          key={`${summary.sourceLabel}-${summary.message}`}
          className={`font-mono text-xs ${summary.isError ? "text-destructive" : "text-muted-foreground"}`}
        >
          {summary.sourceLabel}: {summary.message}
        </p>
      ))}
    </div>
  )
}
