"use client"

import { useState } from "react"
import Link from "next/link"
import { reviewCandidateAction } from "@/app/actions/candidate-import"
import type { CandidateReviewRow } from "@/lib/imports/candidate-review"
import { parseDuplicateMatchEvidence } from "@/lib/imports/candidate-dedup"
import { DuplicateStatusBadge } from "@/components/admin/candidate-import-badges"
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

export function CandidateDuplicatePanel({ candidate }: { candidate: CandidateReviewRow }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const matches = parseDuplicateMatchEvidence(candidate.duplicate_match_evidence)

  async function dismissDuplicate() {
    setPending(true)
    setMessage(null)
    const res = await reviewCandidateAction({
      candidateId: candidate.id,
      action: "dismiss_duplicate",
    })
    setPending(false)
    if ("error" in res) {
      setMessage(res.error)
      return
    }
    window.location.reload()
  }

  if (candidate.duplicate_status === "none" && matches.length === 0) {
    return null
  }

  return (
    <section className="border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-amber-200">Duplicate review</h2>
        <DuplicateStatusBadge status={candidate.duplicate_status} />
      </div>

      {matches.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {matches.map((match) => (
            <li key={match.candidateId} className="text-sm text-muted-foreground">
              <Link
                href={`/admin/events/imports/candidates/${match.candidateId}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {match.title}
              </Link>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest">
                {match.sourceKey} · {match.city ?? "unknown city"}
              </span>
              {match.reason ? <span className="block text-xs">{match.reason}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Flagged as a possible duplicate. Automated matching (#269) will populate evidence here when available.
        </p>
      )}

      {candidate.duplicate_status !== "none" ? (
        <div className="mt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={pending}
                className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                Dismiss duplicate flag
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-foreground">Dismiss duplicate flag?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm">
                  Clears duplicate status to none. Does not publish the candidate.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={dismissDuplicate}>Dismiss</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}

      {message ? <p className="mt-2 text-sm text-destructive">{message}</p> : null}
    </section>
  )
}
