-- ViZb: Posts MVP + platform_role (idempotent)
-- Run in Supabase SQL Editor on the project that matches NEXT_PUBLIC_SUPABASE_URL.
--
-- Use this when:
-- - public.posts does not exist yet, OR
-- - profiles.platform_role is missing (required by posts_admin_all RLS + requireAdmin() in the app)
--
-- After running: grant yourself staff (replace email):
--   UPDATE public.profiles p
--   SET platform_role = 'staff_admin'
--   FROM auth.users u
--   WHERE p.id = u.id AND u.email = 'you@example.com';

-- 1) platform_role enum + column
DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM ('user', 'staff_admin', 'staff_support');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role public.platform_role NOT NULL DEFAULT 'user';

-- 2) posts table (matches docs/plans/POSTS_MVP.md)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content_md text NOT NULL,
  cover_image_url text,
  video_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_status_published_at_idx ON public.posts (status, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts (author_user_id);

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;
CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_public_read_published ON public.posts;
CREATE POLICY posts_public_read_published
ON public.posts
FOR SELECT
USING (
  status = 'published'
  AND (published_at IS NULL OR published_at <= now())
);

DROP POLICY IF EXISTS posts_admin_all ON public.posts;
CREATE POLICY posts_admin_all
ON public.posts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.platform_role = 'staff_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.platform_role = 'staff_admin'
  )
);
