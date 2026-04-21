# Contract: community posts (public feed posts)

**Status:** MVP (Supabase-native, Markdown)

## TL;DR

- Store posts in Supabase table: `public.posts` (Markdown in `content_md`).
- Public can read **published** posts only.
- Staff admins (by `profiles.platform_role = 'staff_admin'`) can CRUD.
- Public routes: `/` (module) + `/p` + `/p/[slug]`.
- Admin routes: `/admin` (overview) + `/admin/posts/*`.
- Canonical SQL/RLS: `docs/plans/POSTS_MVP.md`.
- Journeys:
  - `docs/journeys/public_discovery_to_member.md`
  - `docs/journeys/admin_publishes_post.md`.

## Purpose

Enable **staff admins** to publish posts (articles + optional video) that appear on **public** surfaces (homepage module, post detail), while keeping ViZb as **one cohesive app** (same auth, same DB, same UI system).

This is intentionally **not WordPress** yet.

## Data model (MVP)

Table: `public.posts`

Fields (MVP):
- `title` (text)
- `slug` (text, unique)
- `excerpt` (text, nullable)
- `content_md` (text, markdown)
- `cover_image_url` (text, nullable) — public URL; may be Supabase Storage (`post-covers` bucket) or any HTTPS URL for legacy rows
- `video_url` (text, nullable)
- `content_image_urls` (text[], default `{}`) — up to **6** public URLs for inline gallery images below the article body on `/p/[slug]`; app only persists URLs under Storage bucket **`posts`** (see below)
- `status` (draft|published|archived)
- `published_at` (timestamptz, nullable)
- `author_user_id` (uuid → auth.users, nullable)
- `created_at`, `updated_at`

Canonical SQL + RLS: `docs/plans/POSTS_MVP.md`

## Cover images (storage)

- **Bucket:** `post-covers` (public read; **INSERT/UPDATE/DELETE** restricted to `staff_admin` via `storage.objects` policies).
- **Paths:** `drafts/{admin_user_id}/…` before the post row exists; `{post_id}/…` when editing an existing post.
- Migrations: `20260420180000_post_covers_storage.sql` (initial); `20260420224705_storage_buckets_event_flyers_and_posts.sql` (ensures `post-covers`, `event-flyers`, and `posts` buckets + policies on hosted DBs).

## Post body / gallery images (storage)

- **Bucket:** `posts` (public read; **INSERT/UPDATE/DELETE** restricted to `staff_admin`).
- **Paths:** same pattern as covers — `drafts/{admin_user_id}/…` before save, `{post_id}/…` when the post exists.
- **App:** uploads via `uploadAdminPostBodyImage` / `removeAdminPostBodyImageFromStorage` in `app/actions/admin-posts.ts`; URLs stored in `posts.content_image_urls` (max 6). Schema: `supabase/migrations/20260420231755_posts_content_image_urls.sql`.

## RLS + access rules (MVP)

- Public can `select` only:
  - `status='published'` AND (`published_at` is null OR `published_at <= now()`)
- Staff admin can CRUD:
  - determined by `profiles.platform_role = 'staff_admin'`

## Routes + owners

Public:
- `/` — includes "From ViZb" module (latest published posts)
- `/p/[slug]` — public post detail

Admin (staff only):
- `/admin/posts` — list
- `/admin/posts/new` — create
- `/admin/posts/[id]` — edit/update

## Rendering rules

- Source format: **Markdown** stored in `content_md`.
- MVP renderer is **safe** (no raw HTML): headings, paragraphs, lists, code blocks, inline code, bold.
- **Gallery:** `content_image_urls` (if non-empty) renders as a **Photos** grid below the markdown body on `/p/[slug]`.
- Upgrade path: swap renderer to `react-markdown` + sanitization + embeds once we need richer formatting.

## Failure modes / fallbacks

- If Supabase env is missing locally or table isn’t migrated yet:
  - Public: posts module returns empty and does not break page.
  - Admin: posts list shows "setup required" and links to `docs/plans/POSTS_MVP.md`.

## Consistency requirement (avoid "two apps")

Public surfaces must use the same design tokens/components as dashboard:
- GlassCard, NeonButton/NeonLink, chips/tags, typography ramp.

