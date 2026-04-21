# Journey — Admin publishes a post (Posts MVP)

**Status:** MVP

## Goal
A staff admin creates a Markdown post and publishes it so it appears on public surfaces.

## Preconditions
- User is authenticated and has `profiles.platform_role = 'staff_admin'`.
- Supabase table + RLS policies exist (see `docs/plans/POSTS_MVP.md`).

## Flow

### A) Create a draft
1. Admin navigates to **`/admin`**.
2. Admin clicks **Posts → New post**.
3. Admin lands on **`/admin/posts/new`**.
4. Admin fills:
   - Title
   - (Optional) Slug (auto-derived from title)
   - (Optional) Excerpt (auto-derived from Markdown if left blank)
   - Markdown content
   - (Optional) Cover image (upload to Storage) / Video URL
   - Status = `draft`
5. Admin submits.
6. System creates row in `public.posts` and redirects to **`/admin/posts/[id]`**.

**Expected results:**
- Post is visible in **`/admin/posts`** under **Draft**.
- Post does **not** appear on public:
  - homepage module (`/`)
  - `/p`
  - `/p/[slug]`

### B) Publish
1. Admin opens the post editor **`/admin/posts/[id]`**.
2. Admin changes status to `published`.
3. Admin saves.
4. System sets `published_at` (if not already set) and redirects back to editor with `?saved=1`.

**Expected results:**
- Post appears on public:
  - homepage module (`/`)
  - `/p`
  - `/p/[slug]`
- Editor shows a Saved confirmation and (when published) a **View public** link.

### C) Archive
1. Admin changes status to `archived`.
2. Admin saves.

**Expected results:**
- Post no longer appears on public surfaces.
- Post remains visible in admin under **Archived**.

## Failure modes & handling
- **Slug collision:** If slug already exists, admin sees a friendly message and must change slug.
- **Supabase env missing in preview:** Admin pages should render a safe message instead of crashing.
