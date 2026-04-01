# Contract: community posts (public feed posts)

**Status:** MVP (Supabase-native, Markdown)

## TL;DR

- Store posts in Supabase table: `public.posts` (Markdown in `content_md`).
- Public can read **published** posts only.
- Staff admins (by `profiles.platform_role = 'staff_admin'`) can CRUD.
- Public routes: `/` (module) + `/p/[slug]`.
- Admin routes: `/admin/posts/*`.
- Canonical SQL/RLS: `docs/plans/POSTS_MVP.md`.

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
- `cover_image_url` (text, nullable)
- `video_url` (text, nullable)
- `status` (draft|published|archived)
- `published_at` (timestamptz, nullable)
- `author_user_id` (uuid → auth.users, nullable)
- `created_at`, `updated_at`

Canonical SQL + RLS: `docs/plans/POSTS_MVP.md`

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
- Upgrade path: swap renderer to `react-markdown` + sanitization + embeds once we need richer formatting.

## Failure modes / fallbacks

- If Supabase env is missing locally or table isn’t migrated yet:
  - Public: posts module returns empty and does not break page.
  - Admin: posts list shows "setup required" and links to `docs/plans/POSTS_MVP.md`.

## Consistency requirement (avoid "two apps")

Public surfaces must use the same design tokens/components as dashboard:
- GlassCard, NeonButton/NeonLink, chips/tags, typography ramp.

