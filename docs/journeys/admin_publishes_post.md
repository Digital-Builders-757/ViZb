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
4. Admin fills title, optional caption, Markdown content, optional cover/video/images.
5. Admin clicks **Save as draft** (or **Create & publish** to go live immediately).
6. System creates row in `public.posts` and redirects to **`/admin/posts/[id]`**.

**Expected results:**
- Post is visible in **`/admin/posts`** under **Draft** (unless published on create).
- Draft posts do **not** appear on **`/p`** or **`/p/[slug]`**.

### B) Publish
1. Admin opens **`/admin/posts/[id]`**.
2. Editor shows a status badge: **Draft — not public yet**, **Live on /p**, or **Archived**.
3. Admin clicks **Publish** (or sets status to Published and saves).
4. System sets `published_at` (if not already set) and redirects with `?saved=1&published=1`.

**Expected results:**
- Post appears on **`/p`** and **`/p/[slug]`**.
- Editor shows **Published** confirmation and **View public** link.

### C) Archive
1. Admin sets status to **Archived** in the status select and clicks **Save changes**.

**Expected results:**
- Post no longer appears on public surfaces.
- Post remains visible in admin under **Archived**.

## Failure modes & handling
- **Slug collision:** Redirect `?error=slug_taken` with friendly copy on **`/admin/posts/new`**.
- **Missing fields / invalid images:** Redirect `?error=missing_fields` or `?error=invalid_images` with amber banner on editor.
- **DB save failure:** Redirect `?error=save_failed`; server logs **`[admin.posts.save]`** or **`[admin.posts.create]`** (see `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`).
- **Supabase env missing in preview:** Admin pages render a safe message instead of crashing.

## Logging (staff troubleshooting)
- Application logs use scoped prefixes in Vercel/server output: **`[admin.posts.save]`**, **`[admin.posts.create]`**, **`[admin.posts.counts]`**.
- No secrets, tokens, or raw credentials are logged.
