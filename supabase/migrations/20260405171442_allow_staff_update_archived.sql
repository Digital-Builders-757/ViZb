-- Migration 024: Allow staff admins to update archived events (for unarchive/moderation)
-- Fixes migration 023 policy logic which unintentionally blocked staff from updating archived rows.
--
-- Supabase Preview applies files from supabase/migrations, but this project was
-- linked after the first production migrations had already run. The two
-- 202602 placeholder files preserve remote history without recreating the
-- bootstrap schema, so fresh preview branches can reach this migration before
-- public.events exists. Keep the recovered baseline here idempotent so preview
-- branches and already-bootstrapped databases both converge on the pre-024
-- schema shape.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$ BEGIN
  CREATE TYPE public.org_type AS ENUM (
    'venue',
    'partner',
    'promoter',
    'collective',
    'brand',
    'nonprofit',
    'independent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'collective';
ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'brand';
ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'nonprofit';
ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'independent';

DO $$ BEGIN
  CREATE TYPE public.org_status AS ENUM (
    'pending',
    'pending_review',
    'active',
    'suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.org_status ADD VALUE IF NOT EXISTS 'pending_review';

DO $$ BEGIN
  CREATE TYPE public.org_member_role AS ENUM (
    'owner',
    'manager',
    'staff',
    'admin',
    'editor',
    'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'viewer';

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM (
    'draft',
    'pending',
    'pending_review',
    'published',
    'cancelled',
    'rejected',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'archived';

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.media_kind AS ENUM ('flyer', 'gallery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM ('user', 'staff_admin', 'staff_support');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz DEFAULT now(),
  source text DEFAULT 'website',
  phone_number text
);

ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public inserts" ON public.subscribers;
CREATE POLICY "Allow public inserts" ON public.subscribers
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to check their own email" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_select_admin_only" ON public.subscribers;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  role_admin boolean NOT NULL DEFAULT false,
  platform_role public.platform_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role public.platform_role NOT NULL DEFAULT 'user';

UPDATE public.profiles
  SET platform_role = 'staff_admin'
  WHERE role_admin = true AND platform_role = 'user';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND platform_role = (SELECT platform_role FROM public.profiles WHERE id = auth.uid())
    AND role_admin = (SELECT role_admin FROM public.profiles WHERE id = auth.uid())
  );

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, updated_at)
  ON public.profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type public.org_type NOT NULL DEFAULT 'promoter',
  status public.org_status NOT NULL DEFAULT 'pending',
  description text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_member_role NOT NULL DEFAULT 'editor',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

UPDATE public.organization_members SET role = 'admin' WHERE role = 'manager';
UPDATE public.organization_members SET role = 'editor' WHERE role = 'staff';

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS org_role_allowed;

ALTER TABLE public.organization_members
  ADD CONSTRAINT org_role_allowed
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.is_staff_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.platform_role = 'staff_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND role = 'owner'::public.org_member_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;

DROP POLICY IF EXISTS "orgs_select_active" ON public.organizations;
CREATE POLICY "orgs_select_active" ON public.organizations
  FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "orgs_select_own_member" ON public.organizations;
DROP POLICY IF EXISTS "orgs_select_member" ON public.organizations;
CREATE POLICY "orgs_select_member" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id));

DROP POLICY IF EXISTS "orgs_select_admin" ON public.organizations;
CREATE POLICY "orgs_select_admin" ON public.organizations
  FOR SELECT
  USING (public.is_staff_admin());

DROP POLICY IF EXISTS "orgs_insert_authenticated" ON public.organizations;
DROP POLICY IF EXISTS "orgs_insert_any_auth_user" ON public.organizations;
DROP POLICY IF EXISTS "orgs_insert_staff_only" ON public.organizations;
CREATE POLICY "orgs_insert_staff_only" ON public.organizations
  FOR INSERT
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS "orgs_update_owner" ON public.organizations;
CREATE POLICY "orgs_update_owner" ON public.organizations
  FOR UPDATE
  USING (public.is_org_owner(id));

DROP POLICY IF EXISTS "orgs_update_admin" ON public.organizations;
CREATE POLICY "orgs_update_admin" ON public.organizations
  FOR UPDATE
  USING (public.is_staff_admin());

DROP POLICY IF EXISTS "org_members_select_same_org" ON public.organization_members;
CREATE POLICY "org_members_select_same_org" ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS "org_members_select_admin" ON public.organization_members;
CREATE POLICY "org_members_select_admin" ON public.organization_members
  FOR SELECT
  USING (public.is_staff_admin());

DROP POLICY IF EXISTS "org_members_insert_self" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert_staff_only" ON public.organization_members;
CREATE POLICY "org_members_insert_staff_only" ON public.organization_members
  FOR INSERT
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS "org_members_update_owner" ON public.organization_members;
CREATE POLICY "org_members_update_owner" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.is_org_owner(org_id));

DROP POLICY IF EXISTS "org_members_delete_owner" ON public.organization_members;
CREATE POLICY "org_members_delete_owner" ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.is_org_owner(org_id));

DROP POLICY IF EXISTS "subscribers_select_admin_only" ON public.subscribers;
CREATE POLICY "subscribers_select_admin_only" ON public.subscribers
  FOR SELECT
  USING (public.is_staff_admin());

CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text,
  role public.org_member_role NOT NULL DEFAULT 'editor',
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  claimed_by uuid REFERENCES auth.users(id),
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invites_all_staff" ON public.org_invites;
CREATE POLICY "invites_all_staff" ON public.org_invites
  FOR ALL
  USING (public.is_staff_admin());

DROP POLICY IF EXISTS "invites_select_org_members" ON public.org_invites;
CREATE POLICY "invites_select_org_members" ON public.org_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.org_id = org_invites.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_org_invites_token ON public.org_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON public.org_invites(org_id);

CREATE TABLE IF NOT EXISTS public.host_applications (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name text NOT NULL,
  org_type public.org_type NOT NULL DEFAULT 'collective',
  description text,
  website text,
  social_links text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'rejected')),
  staff_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.host_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_select_own" ON public.host_applications;
CREATE POLICY "applications_select_own" ON public.host_applications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "applications_insert_own" ON public.host_applications;
CREATE POLICY "applications_insert_own" ON public.host_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "applications_all_staff" ON public.host_applications;
CREATE POLICY "applications_all_staff" ON public.host_applications
  FOR ALL
  USING (public.is_staff_admin());

CREATE INDEX IF NOT EXISTS idx_host_applications_status ON public.host_applications(status);
CREATE INDEX IF NOT EXISTS idx_host_applications_user_id ON public.host_applications(user_id);

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS posts_status_published_at_idx
  ON public.posts (status, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts (author_user_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_invite(invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO v_invite
    FROM public.org_invites
    WHERE org_invites.token = invite_token
    FOR UPDATE
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invite not found');
  END IF;

  IF v_invite.claimed_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Invite has already been claimed');
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invite has expired');
  END IF;

  IF v_invite.email IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = v_user_id
        AND lower(u.email) = lower(v_invite.email)
    ) THEN
      RETURN jsonb_build_object('error', 'This invite is for a different email address');
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE org_id = v_invite.org_id
      AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'You are already a member of this organization');
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_invite.org_id, v_user_id, v_invite.role);

  UPDATE public.org_invites
    SET claimed_by = v_user_id,
        claimed_at = now()
    WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_invite.org_id,
    'role', v_invite.role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  venue_name text NOT NULL,
  address text,
  city text NOT NULL,
  categories text[] NOT NULL DEFAULT ARRAY['other']::text[],
  status public.event_status NOT NULL DEFAULT 'draft',
  flyer_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  CONSTRAINT events_org_slug_unique UNIQUE (org_id, slug),
  CONSTRAINT events_categories_check CHECK (
    cardinality(categories) >= 1
    AND categories <@ ARRAY['party','workshop','networking','social','concert','other']::text[]
  )
);

CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_categories_gin ON public.events USING GIN (categories);
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events(status);
CREATE INDEX IF NOT EXISTS events_reviewed_at_idx ON public.events(reviewed_at);

COMMENT ON COLUMN public.events.categories IS 'One or more of: party, workshop, networking, social, concert, other.';

CREATE TABLE IF NOT EXISTS public.event_media (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  kind public.media_kind NOT NULL DEFAULT 'gallery',
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_media_event_id ON public.event_media(event_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.guard_event_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT p.platform_role::text INTO caller_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF caller_role = 'staff_admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
    RAISE EXCEPTION 'Only staff admins can modify reviewed_by';
  END IF;

  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Only staff admins can modify reviewed_at';
  END IF;

  IF NEW.review_notes IS DISTINCT FROM OLD.review_notes THEN
    RAISE EXCEPTION 'Only staff admins can modify review_notes';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('published', 'rejected') THEN
      RAISE EXCEPTION 'Only staff admins can set status to published or rejected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_event_review_fields ON public.events;
CREATE TRIGGER trg_guard_event_review_fields
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_event_review_fields();

DROP POLICY IF EXISTS "events_select_published" ON public.events;
CREATE POLICY "events_select_published" ON public.events
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "events_select_org_member" ON public.events;
CREATE POLICY "events_select_org_member" ON public.events
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS "events_select_staff" ON public.events;
CREATE POLICY "events_select_staff" ON public.events
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

DROP POLICY IF EXISTS "events_insert_org_member" ON public.events;
CREATE POLICY "events_insert_org_member" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(org_id)
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "events_insert_staff" ON public.events;
CREATE POLICY "events_insert_staff" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff_admin()
    AND created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = events.org_id)
  );

DROP POLICY IF EXISTS "events_update_org_admin" ON public.events;
CREATE POLICY "events_update_org_admin" ON public.events
  FOR UPDATE TO authenticated
  USING (
    status <> 'archived'
    AND (
      EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.org_id = events.org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
      )
      OR public.is_staff_admin()
    )
  );

DROP POLICY IF EXISTS "events_update_editor_own_draft" ON public.events;
CREATE POLICY "events_update_editor_own_draft" ON public.events
  FOR UPDATE TO authenticated
  USING (
    status = 'draft'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "events_update_staff" ON public.events;
CREATE POLICY "events_update_staff" ON public.events
  FOR UPDATE TO authenticated
  USING (public.is_staff_admin())
  WITH CHECK (public.is_staff_admin());

DROP POLICY IF EXISTS "events_delete_owner" ON public.events;
CREATE POLICY "events_delete_owner" ON public.events
  FOR DELETE TO authenticated
  USING (public.is_org_owner(org_id) OR public.is_staff_admin());

DROP POLICY IF EXISTS "event_media_select_published" ON public.event_media;
CREATE POLICY "event_media_select_published" ON public.event_media
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_media.event_id
        AND e.status = 'published'
    )
  );

DROP POLICY IF EXISTS "event_media_select_org_member" ON public.event_media;
CREATE POLICY "event_media_select_org_member" ON public.event_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_media.event_id
        AND public.is_org_member(e.org_id)
    )
  );

DROP POLICY IF EXISTS "event_media_insert_org_member" ON public.event_media;
CREATE POLICY "event_media_insert_org_member" ON public.event_media
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_media.event_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "event_media_delete_org_admin" ON public.event_media;
CREATE POLICY "event_media_delete_org_admin" ON public.event_media
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_media.event_id
        AND (public.is_org_owner(e.org_id) OR public.is_staff_admin())
    )
  );

DROP POLICY IF EXISTS "events_update_org_admin" ON public.events;
CREATE POLICY "events_update_org_admin" ON public.events
  FOR UPDATE TO authenticated
  USING (
    is_staff_admin()
    OR (
      status <> 'archived'
      AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = events.org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
      )
    )
  );
