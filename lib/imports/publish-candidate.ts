import type { SupabaseClient } from "@supabase/supabase-js"
import { slugify } from "@/lib/utils"
import { EVENT_KIND_COMMUNITY } from "@/lib/events/event-kind"
import { normalizeCategoriesForPersistence } from "@/lib/events/categories"
import { fetchPlatformOrganization } from "@/lib/orgs/platform-org"
import type { CandidateReviewRow } from "@/lib/imports/candidate-review"
import { canPublishCandidate } from "@/lib/imports/candidate-review"

export type PublishCandidateResult =
  | { ok: true; eventId: string; slug: string }
  | { ok: false; error: string }

function resolveExternalRsvpUrl(candidate: CandidateReviewRow): string | null {
  const ticket = candidate.external_ticket_url?.trim()
  if (ticket && /^https?:\/\//i.test(ticket)) return ticket
  const source = candidate.source_url?.trim()
  if (source && /^https?:\/\//i.test(source)) return source
  return null
}

async function buildUniqueSlug(
  admin: SupabaseClient,
  orgId: string,
  title: string,
): Promise<string> {
  let slug = slugify(title)
  if (!slug) slug = `import-${Date.now().toString(36)}`

  const { data: existing } = await admin
    .from("events")
    .select("slug")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }
  return slug
}

export async function publishCandidateToEvent(
  admin: SupabaseClient,
  candidate: CandidateReviewRow,
  actorId: string,
): Promise<PublishCandidateResult> {
  const publishCheck = canPublishCandidate(candidate)
  if (!publishCheck.allowed) {
    return { ok: false, error: publishCheck.reason ?? "Cannot publish candidate." }
  }

  if (candidate.canonical_event_id) {
    const { data: existing } = await admin
      .from("events")
      .select("id, slug, status")
      .eq("id", candidate.canonical_event_id)
      .maybeSingle()

    if (existing?.status === "published") {
      return { ok: true, eventId: existing.id as string, slug: existing.slug as string }
    }
  }

  const externalRsvpUrl = resolveExternalRsvpUrl(candidate)
  if (!externalRsvpUrl) {
    return { ok: false, error: "A valid external ticket or source URL is required to publish." }
  }

  const { data: platformOrg, error: orgError } = await fetchPlatformOrganization(admin)
  if (orgError || !platformOrg) {
    return { ok: false, error: orgError ?? "Platform organization not configured." }
  }

  const now = new Date().toISOString()
  const slug = await buildUniqueSlug(admin, platformOrg.id, candidate.title)
  const categories = normalizeCategoriesForPersistence(candidate.categories)

  const { data: existingBySource } = await admin
    .from("events")
    .select("id, slug, status")
    .eq("source", candidate.source_key)
    .eq("source_event_id", candidate.source_event_id)
    .maybeSingle()

  if (existingBySource) {
    const { error: updateError } = await admin
      .from("events")
      .update({
        title: candidate.title,
        description: candidate.description,
        starts_at: candidate.starts_at,
        ends_at: candidate.ends_at,
        venue_name: candidate.venue_name ?? "TBD",
        address: candidate.address ?? "",
        city: candidate.city ?? "",
        categories,
        flyer_url: candidate.image_url,
        external_rsvp_url: externalRsvpUrl,
        source_url: candidate.source_url,
        source_payload: candidate.source_payload,
        import_status: "approved",
        status: "published",
        published_at: now,
        approved_at: now,
        approved_by: actorId,
        last_imported_at: candidate.last_imported_at,
        updated_at: now,
      })
      .eq("id", existingBySource.id)

    if (updateError) {
      return { ok: false, error: updateError.message }
    }

    return {
      ok: true,
      eventId: existingBySource.id as string,
      slug: existingBySource.slug as string,
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from("events")
    .insert({
      org_id: platformOrg.id,
      title: candidate.title,
      slug,
      description: candidate.description,
      starts_at: candidate.starts_at,
      ends_at: candidate.ends_at,
      venue_name: candidate.venue_name ?? "TBD",
      address: candidate.address ?? "",
      city: candidate.city ?? "",
      categories,
      flyer_url: candidate.image_url,
      event_kind: EVENT_KIND_COMMUNITY,
      external_rsvp_url: externalRsvpUrl,
      status: "published",
      published_at: now,
      created_by: actorId,
      source: candidate.source_key,
      source_event_id: candidate.source_event_id,
      source_url: candidate.source_url,
      source_payload: candidate.source_payload,
      import_status: "approved",
      approved_at: now,
      approved_by: actorId,
      last_imported_at: candidate.last_imported_at,
    })
    .select("id, slug")
    .single()

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "Failed to create canonical event." }
  }

  return { ok: true, eventId: inserted.id as string, slug: inserted.slug as string }
}
