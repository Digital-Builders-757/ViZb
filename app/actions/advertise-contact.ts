"use server"

import { advertiseInquirySchema } from "@/lib/advertise-contact-schema"
import { getAdminInboxEmail } from "@/lib/email/project-env"
import { logError } from "@/lib/log"
import { parseSubmissionContextAttribution } from "@/lib/partnerships/advertise-context"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export type AdvertiseContactState =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

function fdStr(formData: FormData, key: string): string {
  const v = formData.get(key)
  if (v == null) return ""
  return typeof v === "string" ? v : ""
}

function saveFailureMessage(inbox: string): string {
  return `We couldn't save your inquiry. Please email ${inbox}.`
}

function successMessage(inbox: string): string {
  return `Thanks — we received your inquiry. We'll follow up soon. You can also reach us at ${inbox}.`
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
  const inbox = getAdminInboxEmail()

  const submissionContextRaw = fdStr(formData, "submissionContext")
  const submissionContext =
    submissionContextRaw.trim().length > 0 ? parseSubmissionContextAttribution(submissionContextRaw) : undefined

  if (!isServiceRoleConfigured()) {
    logError("advertise.inquiry", "service role not configured")
    return { ok: false, error: saveFailureMessage(inbox) }
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    logError("advertise.inquiry", e)
    return { ok: false, error: saveFailureMessage(inbox) }
  }

  const { error } = await admin.from("advertise_inquiries").insert({
    full_name: data.fullName,
    email: data.email,
    company: data.company ?? null,
    phone: data.phone ?? null,
    interest_type: data.interestType,
    budget_range: data.budgetRange ?? null,
    message: data.message,
    submission_context: submissionContext ?? null,
    status: "new",
    metadata: { source: "advertise_form" },
  })

  if (error) {
    logError("advertise.inquiry", error)
    return { ok: false, error: saveFailureMessage(inbox) }
  }

  return { ok: true, message: successMessage(inbox) }
}
