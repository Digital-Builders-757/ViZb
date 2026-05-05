import Link from "next/link"
import { Megaphone } from "lucide-react"

import { GlassCard } from "@/components/ui/glass-card"

function advertisePartnershipHref(orgSlug: string, eventSlug?: string): string {
  const q = new URLSearchParams({ from: "organizer" })
  const org = orgSlug.trim().toLowerCase()
  if (/^[a-z0-9-]{1,120}$/i.test(org)) q.set("org", org)
  if (eventSlug && /^[a-z0-9-]{1,120}$/i.test(eventSlug.trim())) {
    q.set("event", eventSlug.trim().toLowerCase())
  }
  return `/advertise?${q.toString()}`
}

interface OrganizerPartnershipUpsellProps {
  orgSlug: string
  /** When set, adds `event=` to the inquire link for attribution in the emailed note. */
  eventSlug?: string
  variant: "dashboard" | "event"
}

/**
 * Clearly labeled pathway to ViZb partnerships (no monetized slots inside discovery timelines).
 */
export function OrganizerPartnershipUpsell({
  orgSlug,
  eventSlug,
  variant,
}: OrganizerPartnershipUpsellProps) {
  const href = advertisePartnershipHref(orgSlug, eventSlug)
  const isEvent = variant === "event"

  return (
    <GlassCard className="mt-8 border border-[color:var(--neon-hairline)]/80 bg-[color:var(--neon-surface)]/12 p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/10">
            <Megaphone className="h-5 w-5 text-amber-200/95" aria-hidden />
          </div>
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-100/95">
              Partnership · paid placement inquires only
            </span>
            <h3 className="mt-2 font-serif text-base font-bold text-foreground md:text-lg text-balance">
              {isEvent ? "Grow turnout — optional ViZb placement" : "Reach more attendees (optional partnerships)"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">
              {isEvent
                ? "Explore co-marketing, labeled discovery slots, and newsletter mentions. Editorial Staff picks stay separate—we never blur paid versus curated."
                : "Ask about sponsorship, labeled placements, or co-marketing. Paid inventory stays clearly marked so attendees know what is editorial."}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end shrink-0">
          <Link
            href={href}
            className="vibe-focus-ring inline-flex items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:bg-amber-500/[0.14] sm:w-auto text-center"
          >
            Discuss promotion
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center sm:text-right max-w-[16rem] sm:max-w-none">
            No obligation · inquiry only
          </p>
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground border-t border-[color:var(--neon-hairline)]/55 pt-4">
        <span className="font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Labeling</span>{" "}
        — Sponsored placements are disclosed on-site wherever they run (separate from Staff pick highlights).
      </p>
    </GlassCard>
  )
}
