"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, ImageIcon } from "lucide-react"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { normalizeCategories } from "@/lib/events/categories"
import {
  extractOrganizerLabel,
  extractPriceHint,
  type CandidateReviewRow,
} from "@/lib/imports/candidate-review"
import type { CandidateReviewHistoryRow } from "@/lib/admin/load-candidate-detail"
import {
  DuplicateStatusBadge,
  ReviewStatusBadge,
  SourceBadge,
} from "@/components/admin/candidate-import-badges"
import { CandidateDuplicatePanel } from "@/components/admin/candidate-duplicate-panel"
import { CandidateReviewActions } from "@/components/admin/candidate-review-actions"

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function CandidateImportDetail({
  candidate,
  reviews,
  canonicalEvent,
}: {
  candidate: CandidateReviewRow
  reviews: CandidateReviewHistoryRow[]
  canonicalEvent: { id: string; slug: string; title: string; status: string } | null
}) {
  const cats = normalizeCategories(candidate.categories)
  const priceHint = extractPriceHint(candidate)
  const organizer = extractOrganizerLabel(candidate)
  const ticketUrl = candidate.external_ticket_url ?? candidate.source_url

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="h-40 w-full max-w-xs shrink-0 overflow-hidden border border-border bg-muted lg:h-48">
          {candidate.image_url ? (
            <Image
              src={candidate.image_url}
              alt=""
              width={320}
              height={192}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge sourceKey={candidate.source_key} />
            <ReviewStatusBadge status={candidate.review_status} />
            <DuplicateStatusBadge status={candidate.duplicate_status} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">{candidate.title}</h1>
          {candidate.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{candidate.description}</p>
          ) : null}
        </div>
      </div>

      <CandidateDuplicatePanel candidate={candidate} />

      <CandidateReviewActions candidate={candidate} canonicalEventSlug={canonicalEvent?.slug} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailField label="Start" value={formatDateTime(candidate.starts_at)} />
        <DetailField label="End" value={formatDateTime(candidate.ends_at)} />
        <DetailField label="Timezone" value={candidate.timezone ?? "—"} />
        <DetailField label="Venue" value={candidate.venue_name ?? "—"} />
        <DetailField label="Address" value={candidate.address ?? "—"} />
        <DetailField label="City" value={candidate.city ?? "—"} />
        <DetailField label="Region" value={candidate.region ?? "—"} />
        <DetailField label="Organizer" value={organizer ?? "—"} />
        <DetailField label="Price" value={priceHint ?? "—"} />
        <DetailField label="Source event ID" value={candidate.source_event_id} mono />
        <DetailField label="Import run ID" value={candidate.last_import_run_id ?? "—"} mono />
        <DetailField label="Last imported" value={formatDateTime(candidate.last_imported_at)} />
        <DetailField label="Canonical event ID" value={candidate.canonical_event_id ?? "—"} mono />
        <DetailField
          label="Categories"
          value={cats.map((c) => formatCategoryLabel(c)).join(", ") || "—"}
        />
        <DetailField
          label="Ticket URL"
          value={
            ticketUrl ? (
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-neon-a hover:underline"
              >
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              "—"
            )
          }
        />
        {canonicalEvent ? (
          <DetailField
            label="Linked event"
            value={
              <Link href={`/events/${canonicalEvent.slug}`} className="text-neon-a hover:underline">
                {canonicalEvent.title} ({canonicalEvent.status})
              </Link>
            }
          />
        ) : null}
      </section>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Review history</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No review actions recorded yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="border border-border border-l-2 border-l-neon-b p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neon-b">{review.action}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatDateTime(review.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.previous_review_status ?? "—"} → {review.new_review_status ?? "—"}
                </p>
                {review.notes ? <p className="mt-1 text-sm text-foreground">{review.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="border border-border p-4">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Raw source payload (admin)
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">
          {JSON.stringify(candidate.source_payload, null, 2)}
        </pre>
      </details>
    </div>
  )
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="border border-border p-3">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm text-foreground ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</dd>
    </div>
  )
}
