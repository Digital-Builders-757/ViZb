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
6. System creates row in `public.posts` and redirects to **`/admin/posts/[id]?created=1`**.

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
4. System sets `published_at` (if not already set) and redirects back to editor with `?saved=1&status=published`.

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
- **Slug collision:** Redirect to `/admin/posts/new?error=slug_taken&slug=…` with an on-page message; change the title so the auto-generated slug is unique.
- **Empty slug:** Title has no letters/numbers → `?error=empty_slug`.
- **Invalid gallery JSON / URLs:** `?error=invalid_images` — use **Images in post** uploads only (Storage `posts` bucket paths).
- **Missing title or content:** `?error=validation`.
- **Database / RLS errors:** `?error=db_error&message=…`.
- **Supabase env missing:** Setup card on new/edit; `?error=not_configured` if submit is attempted without env.
- **Edit page load failure:** Missing post or schema drift shows **Could not load post** with migration hints (not a blind redirect).
- **Public preview 404:** `/p/[slug]` only serves **published** posts. Drafts show `(not public yet)` in the admin list; use **View public** only after publishing.
