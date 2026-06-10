"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin, requireAuth } from "@/lib/auth-helpers"
import { revalidatePublicEventDiscoveryPaths } from "@/lib/events/revalidate-public-discovery"

const staffPickSchema = z.object({
  eventId: z.string().uuid(),
  isStaffPick: z.boolean(),
})

const reportSchema = z.object({
  eventId: z.string().uuid(),
  message: z
    .string()
    .trim()
    .min(10, "Please add a bit more detail (at least 10 characters).")
    .max(2000, "Message is too long."),
})

export type EventTrustActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string }

export async function setEventStaffPickFromAdmin(
  eventId: string,
  isStaffPick: boolean,
): Promise<EventTrustActionState> {
  const parsed = staffPickSchema.safeParse({ eventId, isStaffPick })
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." }
  }

  const { supabase } = await requireAdmin()

  const { data: row, error: fetchErr } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .maybeSingle()

  if (fetchErr || !row?.slug) {
    return { ok: false, error: fetchErr?.message ?? "Event not found." }
  }

  const { error: updateErr } = await supabase
    .from("events")
    .update({ is_staff_pick: isStaffPick })
    .eq("id", eventId)

  if (updateErr) {
    return { ok: false, error: updateErr.message }
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/events/${eventId}`)
  revalidatePublicEventDiscoveryPaths(row.slug)

  return { ok: true, message: isStaffPick ? "Marked as Staff pick." : "Staff pick removed." }
}

export async function submitEventListingReportMessage(
  eventId: string,
  message: string,
): Promise<EventTrustActionState> {
  const parsed = reportSchema.safeParse({ eventId, message })
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.message?.[0]
    return { ok: false, error: first ?? "Invalid report." }
  }

  const { supabase, user } = await requireAuth()

  const { error } = await supabase.from("event_listing_reports").insert({
    event_id: parsed.data.eventId,
    user_id: user.id,
    body: parsed.data.message,
  })

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "You already submitted a report for this listing.",
      }
    }
    return { ok: false, error: error.message }
  }

  return { ok: true, message: "Thanks — we received your report." }
}
