# Contract: media assets

**Status:** MVP  
**SQL:** `scripts/014_create_event_flyers_bucket.sql`, `scripts/019_staff_event_create_and_flyer_storage.sql`, `supabase/migrations/20260420180000_post_covers_storage.sql`, `supabase/migrations/20260420224705_storage_buckets_event_flyers_and_posts.sql`  
**Code:** `app/actions/event.ts`, `app/actions/admin-posts.ts`, `lib/events/flyer-upload-constraints.ts`, `lib/posts/body-image-upload-constraints.ts`, `lib/supabase/storage-errors.ts`

## Purpose

Media assets support flyer-forward event discovery and the public posts feed. Supabase Storage is the durable file boundary.

## Buckets

| Bucket | Read | Write |
|--------|------|-------|
| `event-flyers` | Public | Org members for their org/event paths; staff admin |
| `post-covers` | Public | Staff admin |
| `posts` | Public | Staff admin for body gallery images |

## Invariants

- Uploads use server actions or trusted server paths; no client-side direct write bypass.
- Storage object paths must include enough ownership context for RLS policies (`org_id`, event/post identifiers).
- Public reads are allowed only for intentionally public assets.
- File type/size constraints live in code and must stay aligned with UX copy.
- Creative guidance lives in [docs/brand/EVENT_CREATIVE_RULES.md](../brand/EVENT_CREATIVE_RULES.md).

## Event flyers

- Official events require a flyer before review/publish.
- Community events may include a flyer but do not require one for review; external RSVP URL is the key requirement.
- Admin community create can attach an optional flyer during the draft creation flow; failure redirects to the event detail recovery path.

## Post media

- Post cover images and body gallery images are staff-admin surfaces.
- Public post routes read published post metadata and public storage URLs.

## Failure modes

| Symptom | First check |
|---------|-------------|
| Upload says bucket missing | Storage migrations, especially `20260420224705` |
| Upload denied | RLS path ownership, org membership, staff role |
| Public image broken | Public bucket policy or stored URL |
