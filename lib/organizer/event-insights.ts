export type OrganizerEventInsightInput = {
  viewCount: number
  saveCount: number
  rsvpCount: number
  checkedInCount: number
  shareClicks?: number
}

export type OrganizerEventInsight = OrganizerEventInsightInput & {
  conversionRate: number | null
  checkInRate: number | null
  tips: string[]
}

export function computeConversionRate(views: number, rsvps: number): number | null {
  if (views <= 0) return null
  const rate = rsvps / views
  if (!Number.isFinite(rate)) return null
  return Math.min(1, Math.max(0, rate))
}

export function computeCheckInRate(rsvps: number, checkedIn: number): number | null {
  if (rsvps <= 0) return null
  const rate = checkedIn / rsvps
  if (!Number.isFinite(rate)) return null
  return Math.min(1, Math.max(0, rate))
}

export function buildOrganizerInsightTips(input: OrganizerEventInsightInput): string[] {
  const tips: string[] = []
  const conversion = computeConversionRate(input.viewCount, input.rsvpCount)

  if (input.viewCount === 0) {
    tips.push("Share your event link to start collecting page views.")
  } else if (conversion != null && conversion < 0.05) {
    tips.push("Views are landing but RSVPs are low — refresh the flyer or add a clearer date and venue.")
  }

  if (input.saveCount > 0 && input.rsvpCount === 0) {
    tips.push("People are saving this event — add a strong RSVP call-to-action on the detail page.")
  }

  const checkInRate = computeCheckInRate(input.rsvpCount, input.checkedInCount)
  if (input.rsvpCount > 0 && checkInRate != null && checkInRate < 0.5) {
    tips.push("Check-in rate is below half of RSVPs — remind guests to bring their ticket QR.")
  }

  if (tips.length === 0 && input.viewCount > 0) {
    tips.push("Metrics look healthy — keep sharing and post a recap after the event.")
  }

  return tips
}

export function buildOrganizerEventInsights(input: OrganizerEventInsightInput): OrganizerEventInsight {
  return {
    ...input,
    shareClicks: input.shareClicks ?? 0,
    conversionRate: computeConversionRate(input.viewCount, input.rsvpCount),
    checkInRate: computeCheckInRate(input.rsvpCount, input.checkedInCount),
    tips: buildOrganizerInsightTips(input),
  }
}

export function formatInsightPercent(rate: number | null): string {
  if (rate == null) return "—"
  return `${Math.round(rate * 100)}%`
}
