# ViZb Posts (MVP) — Supabase-native (Markdown)

Goal: Let staff admins publish posts (articles + optional video) that appear on the **public** experience (homepage + optional /posts later), while keeping the app as a **single cohesive product**.

This is the simplest path (no WordPress / headless CMS yet): one DB, one auth, one permission model.

---

## 1) Database schema (SQL)

> Run this in **Supabase SQL Editor** on the target environment.

```sql
-- POSTS (MVP)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content_md text not null,
  cover_image_url text,
  video_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  author_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists posts_status_published_at_idx on public.posts (status, published_at desc);
create index if not exists posts_author_idx on public.posts (author_user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();
```

---

## 2) Row Level Security (RLS)

Assumption: admins are users whose `profiles.platform_role = 'staff_admin'`.

```sql
alter table public.posts enable row level security;

-- Public can read published posts only
drop policy if exists posts_public_read_published on public.posts;
create policy posts_public_read_published
on public.posts
for select
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

-- Staff admins can do everything
-- NOTE: If your profiles table lives in public.profiles and matches auth.users.id
-- this policy uses an EXISTS check against profiles.

drop policy if exists posts_admin_all on public.posts;
create policy posts_admin_all
on public.posts
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.platform_role = 'staff_admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.platform_role = 'staff_admin'
  )
);
```

---

## 3) URL routing conventions

- Public detail: `/p/[slug]` (short + clean)
- Admin:
  - `/admin/posts` (list)
  - `/admin/posts/new` (create)
  - `/admin/posts/[id]` (edit)

---

## 4) Content format

- Authoring: **Markdown** (`content_md`)
- Optional: `video_url` (YouTube/Vimeo or hosted mp4)

---

## 5) Future upgrade path (when needed)

If/when you want a richer editor:
- Keep `content_md` as the storage format (portable)
- Add a rich editor in the admin UI (MDX or TipTap that exports Markdown)
- Only introduce WordPress headless if you truly need multi-editor workflows + revisions + SEO plugin tooling.
