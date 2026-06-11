import { GlassCard } from "@/components/ui/glass-card"
import {
  buildOrganizerEventInsights,
  formatInsightPercent,
  type OrganizerEventInsightInput,
} from "@/lib/organizer/event-insights"

export function OrganizerEventInsightsPanel({ metrics }: { metrics: OrganizerEventInsightInput }) {
  const insight = buildOrganizerEventInsights(metrics)

  return (
    <GlassCard className="mt-8 p-6 md:p-8">
      <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-4">Event insights</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <InsightStat label="Page views" value={String(insight.viewCount)} />
        <InsightStat label="Saves" value={String(insight.saveCount)} />
        <InsightStat label="RSVPs" value={String(insight.rsvpCount)} />
        <InsightStat label="Check-ins" value={String(insight.checkedInCount)} />
        <InsightStat label="View → RSVP" value={formatInsightPercent(insight.conversionRate)} />
        <InsightStat label="RSVP → check-in" value={formatInsightPercent(insight.checkInRate)} />
      </div>
      {insight.viewCount === 0 && insight.saveCount === 0 && insight.rsvpCount === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Metrics appear once guests view, save, or RSVP to this listing.
        </p>
      ) : (
        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          {insight.tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}

function InsightStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}
