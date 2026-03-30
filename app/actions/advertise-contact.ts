"use server"

import { Resend } from "resend"
import { advertiseInquirySchema } from "@/lib/advertise-contact-schema"
import {
  getAdminInboxEmail,
  getResendApiKey,
  getResendFromAddress,
} from "@/lib/email/project-env"

const INTEREST_LABELS: Record<string, string> = {
  sponsorship: "Sponsorship / paid placement",
  newsletter_placement: "Newsletter or email feature",
  event_partnership: "Event or venue partnership",
  brand_collaboration: "Brand / creative collaboration",
  other: "Other",
}

const BUDGET_LABELS: Record<string, string> = {
  under_500: "Under $500",
  "500_2500": "$500 – $2,500",
  "2500_10000": "$2,500 – $10,000",
  "10000_plus": "$10,000+",
  not_sure: "Not sure yet",
  prefer_not_to_say: "Prefer not to say",
}

function buildPlainBody(data: {
  fullName: string
  email: string
  company?: string
  phone?: string
  interestType: string
  budgetRange?: string
  message: string
}): string {
  const lines = [
    "New “Advertise with ViZb” inquiry",
    "—".repeat(48),
    `Name: ${data.fullName}`,
    `Email: ${data.email}`,
    data.company ? `Organization: ${data.company}` : null,
    data.phone ? `Phone: ${data.phone}` : null,
    `Interest: ${INTEREST_LABELS[data.interestType] ?? data.interestType}`,
    data.budgetRange
      ? `Budget (self-reported): ${BUDGET_LABELS[data.budgetRange] ?? data.budgetRange}`
      : null,
    "",
    "Message:",
    data.message,
    "",
    "—",
    "Reply directly to this thread — Reply-To is set to the submitter.",
  ]
  return lines.filter((l) => l !== null).join("\n")
}

export type AdvertiseContactState =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

function fdStr(formData: FormData, key: string): string {
  const v = formData.get(key)
  if (v == null) return ""
  return typeof v === "string" ? v : ""
}

export async function submitAdvertiseInquiry(formData: FormData): Promise<AdvertiseContactState> {
  const parsed = advertiseInquirySchema.safeParse({
    fullName: fdStr(formData, "fullName"),
    email: fdStr(formData, "email"),
    company: fdStr(formData, "company"),
    phone: fdStr(formData, "phone"),
    interestType: fdStr(formData, "interestType"),
    budgetRange: fdStr(formData, "budgetRange"),
    message: fdStr(formData, "message"),
    companyWebsite: fdStr(formData, "companyWebsite"),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    }
  }

  const data = parsed.data
  const apiKey = getResendApiKey()
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email delivery is not configured. Add RESEND_API_KEY to .env.local and restart the dev server.",
    }
  }

  const to = getAdminInboxEmail()
  const from = getResendFromAddress()
  const subject = `[ViZb] Advertising inquiry — ${data.fullName}`
  const text = buildPlainBody(data)

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: data.email,
      subject,
      text,
    })

    if (error) {
      return {
        ok: false,
        error: error.message || "Could not send message. Try again or email us directly.",
      }
    }

    return {
      ok: true,
      message: "Thanks — we received your note and will get back to you soon.",
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error"
    return { ok: false, error: msg }
  }
}
