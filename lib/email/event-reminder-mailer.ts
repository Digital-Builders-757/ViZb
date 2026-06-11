import { Resend } from "resend"
import { getPublicSiteOrigin } from "@/lib/public-site-url"
import { getResendApiKey, getResendFromAddress } from "@/lib/email/project-env"
import { logError, logWarn } from "@/lib/log"
import { formatDashboardEventWhen } from "@/lib/events/event-display-format"

export type EventReminderEmailPayload = {
  to: string
  eventTitle: string
  eventSlug: string
  startsAt: string
  endsAt: string | null
  venueName: string
  city: string
  ticketHref?: string | null
  source: "saved" | "ticket"
  windowLabel: string
}

export function buildEventReminderEmailSubject(payload: EventReminderEmailPayload): string {
  return `Reminder: ${payload.eventTitle} ${payload.windowLabel}`
}

export function buildEventReminderEmailHtml(payload: EventReminderEmailPayload): string {
  const origin = getPublicSiteOrigin()
  const eventUrl = origin ? `${origin}/events/${payload.eventSlug}` : `/events/${payload.eventSlug}`
  const when = formatDashboardEventWhen(payload.startsAt, payload.endsAt)
  const ticketLine = payload.ticketHref
    ? `<p><a href="${payload.ticketHref}">Open your ticket</a></p>`
    : ""

  return `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5;">
      <p>Your ${payload.source === "saved" ? "saved" : "ticketed"} event is coming up ${payload.windowLabel}.</p>
      <h2 style="margin: 16px 0 8px;">${payload.eventTitle}</h2>
      <p>${when}<br/>${payload.venueName} · ${payload.city}</p>
      <p><a href="${eventUrl}">View event on VIZB</a></p>
      ${ticketLine}
      <p style="color:#666;font-size:12px;margin-top:24px;">Manage reminder preferences in your VIZB profile.</p>
    </div>
  `.trim()
}

export async function sendEventReminderEmail(
  payload: EventReminderEmailPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = getResendApiKey()
  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY not configured" }
  }

  const resend = new Resend(apiKey)
  const subject = buildEventReminderEmailSubject(payload)
  const html = buildEventReminderEmailHtml(payload)

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: payload.to,
    subject,
    html,
  })

  if (error) {
    logError("email.event_reminder", error, { eventSlug: payload.eventSlug })
    return { ok: false, reason: error.message }
  }

  logWarn("email.event_reminder", "sent", { eventSlug: payload.eventSlug, source: payload.source })
  return { ok: true }
}

export function isEventReminderEmailConfigured(): boolean {
  return getResendApiKey() !== null
}
