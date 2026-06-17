"use server"

import { reviewEvent } from "@/app/actions/event"
import { requireAdmin } from "@/lib/auth-helpers"
import { EVENTBRITE_SOURCE } from "@/lib/eventbrite/env"
import { revalidatePath } from "next/cache"

export async function reviewImportedEvent(formData: FormData) {
  return reviewEvent(formData)
}

export async function bulkReviewImportedEvents(
  eventIds: string[],
  action: "approve" | "reject",
  reviewNotes?: string | null,
) {
  await requireAdmin()

  const ids = eventIds.filter((id) => id.trim().length > 0)
  if (ids.length === 0) {
    return { error: "No events selected." }
  }

  const results: { id: string; success?: boolean; error?: string }[] = []

  for (const eventId of ids) {
    const formData = new FormData()
    formData.set("eventId", eventId)
    formData.set("action", action)
    if (reviewNotes) formData.set("review_notes", reviewNotes)
    const res = await reviewEvent(formData)
    results.push({
      id: eventId,
      success: "success" in res && res.success ? true : undefined,
      error: "error" in res ? res.error : undefined,
    })
  }

  revalidatePath("/admin/events/imports")
  revalidatePath("/admin")

  const succeeded = results.filter((r) => r.success)
  const failed = results.filter((r) => r.error)

  if (succeeded.length === 0) {
    return { error: failed[0]?.error ?? "Bulk review failed." }
  }

  const actionLabel = action === "approve" ? "approved" : "rejected"
  const allSucceeded = failed.length === 0

  return {
    success: allSucceeded,
    error: allSucceeded
      ? undefined
      : `${failed.length} of ${results.length} events could not be ${actionLabel}.`,
    processed: results.length,
    failed: failed.length,
    succeededIds: succeeded.map((r) => r.id),
    results,
  }
}

export type ImportedEventQueueRow = {
  id: string
  title: string
  slug: string
  description: string | null
  status: string
  import_status: string | null
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  source_url: string | null
  last_imported_at: string | null
  created_at: string
}

export async function fetchImportedEventQueue(): Promise<{
  events: ImportedEventQueueRow[]
  error: string | null
}> {
  const { supabase } = await requireAdmin()

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, slug, description, status, import_status, starts_at, ends_at, venue_name, city, categories, flyer_url, source_url, last_imported_at, created_at",
    )
    .eq("source", EVENTBRITE_SOURCE)
    .eq("import_status", "pending_review")
    .eq("status", "pending_review")
    .order("last_imported_at", { ascending: false, nullsFirst: false })

  if (error) {
    return { events: [], error: error.message }
  }

  return { events: (data ?? []) as ImportedEventQueueRow[], error: null }
}
