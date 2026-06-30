"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { reviewCandidateAction } from "@/app/actions/candidate-import"
import {
  canPublishCandidate,
  type CandidateReviewRow,
} from "@/lib/imports/candidate-review"
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

export function CandidateReviewActions({
  candidate,
  canonicalEventSlug,
}: {
  candidate: CandidateReviewRow
  canonicalEventSlug?: string | null
}) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const linkIdRef = useRef<HTMLInputElement>(null)
  const mergeIdRef = useRef<HTMLInputElement>(null)
  const publishCheck = canPublishCandidate(candidate)

  async function runAction(
    action: Parameters<typeof reviewCandidateAction>[0]["action"],
    extra?: { canonicalEventId?: string; notes?: string },
  ) {
    setPending(true)
    setMessage(null)
    const res = await reviewCandidateAction({
      candidateId: candidate.id,
      action,
      notes: extra?.notes,
      canonicalEventId: extra?.canonicalEventId,
    })
    setPending(false)
    if ("error" in res) {
      setMessage(res.error)
      return
    }
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || candidate.review_status === "approved_listing"}
          title="Full approve workflow ships with publish (#270)."
          className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground opacity-60"
        >
          Approve (soon)
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending || !publishCheck.allowed}
              title={publishCheck.reason}
              className="min-h-9 border border-neon-a/45 bg-neon-a/10 px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              Publish
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">Publish to ViZb?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                Creates or updates a community listing on the public timeline with external ticket attribution. Native
                ViZb ticketing is not enabled for imported listings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => runAction("publish")}>Publish</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              Reject
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">Reject candidate?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                Optional notes are stored in the audit trail.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              ref={notesRef}
              rows={3}
              className="w-full border border-border bg-background p-2 text-sm"
              placeholder="Rejection reason (optional)"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => runAction("reject", { notes: notesRef.current?.value?.trim() || undefined })}
              >
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              Suppress
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">Suppress candidate?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                Blocks the listing from returning until policy reset or payload change.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => runAction("suppress")}>Suppress</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <button
          type="button"
          disabled
          title="Staff edit form is planned for a follow-up."
          className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground opacity-60"
        >
          Edit (soon)
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className="min-h-9 border border-amber-500/40 px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              Mark duplicate
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">Mark as possible duplicate?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                Sets duplicate status to likely. Publishing will be blocked until resolved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => runAction("mark_likely_duplicate")}>Mark duplicate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              Link event
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">Link canonical event</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                Associates this candidate with an existing `events` row. Does not publish by itself.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input
              ref={linkIdRef}
              defaultValue={candidate.canonical_event_id ?? ""}
              placeholder="Canonical event UUID"
              className="w-full border border-border bg-background p-2 font-mono text-sm"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  runAction("link", {
                    canonicalEventId: linkIdRef.current?.value?.trim(),
                  })
                }
              >
                Link
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={pending || candidate.review_status === "approved_listing"}
              className="min-h-9 border border-amber-500/40 px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              Merge
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">Merge into canonical event</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                Marks this candidate as merged and preserves its source provenance in the candidate audit trail.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input
              ref={mergeIdRef}
              defaultValue={candidate.canonical_event_id ?? ""}
              placeholder="Canonical event UUID"
              className="w-full border border-border bg-background p-2 font-mono text-sm"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  runAction("merge", {
                    canonicalEventId: mergeIdRef.current?.value?.trim(),
                  })
                }
              >
                Merge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {candidate.review_status === "merged" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={pending}
                className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                Undo merge
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-foreground">Undo merge?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm">
                  Returns this candidate to pending review and clears the duplicate link.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => runAction("undo")}>Undo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      {candidate.canonical_event_id && canonicalEventSlug ? (
        <p className="text-sm text-muted-foreground">
          Linked event:{" "}
          <Link href={`/admin/events/${candidate.canonical_event_id}`} className="text-neon-a hover:underline">
            {canonicalEventSlug}
          </Link>
        </p>
      ) : null}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  )
}
