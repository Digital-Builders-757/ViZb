-- ViBE: Invite System (Part 2 - uses enum values from 010a)
-- Adds: platform_role column, is_staff_admin(), org_invites, host_applications,
--        updated RLS, claim_invite RPC

-- ============================================================
-- 1. ADD platform_role COLUMN TO PROFILES
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role public.platform_role NOT NULL DEFAULT 'user';

-- Backfill from existing role_admin boolean
UPDATE public.profiles
  SET platform_role = 'staff_admin'
  WHERE role_admin = true AND platform_role = 'user';

-- Lock down: keep column-level privileges consistent
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, updated_at)
  ON public.profiles TO authenticated;

-- ============================================================
-- 2. HELPER FUNCTION: is_staff_admin()
-- ============================================================

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

-- ============================================================
-- 3. BACKFILL ORG MEMBER ROLES (manager -> admin, staff -> editor)
-- ============================================================

UPDATE public.organization_members SET role = 'admin' WHERE role = 'manager';
UPDATE public.organization_members SET role = 'editor' WHERE role = 'staff';

-- ============================================================
-- 4. ORG_INVITES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text,
  role public.org_member_role NOT NULL DEFAULT 'editor',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  claimed_by uuid REFERENCES auth.users(id),
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- Staff admins can do everything with invites
CREATE POLICY "invites_all_staff" ON public.org_invites
  FOR ALL USING (public.is_staff_admin());

-- Org owners/admins can see their org's invites
CREATE POLICY "invites_select_org_members" ON public.org_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = org_invites.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON public.org_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON public.org_invites(org_id);

-- ============================================================
-- 5. HOST_APPLICATIONS TABLE (Request to Host)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.host_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Users can see their own applications
CREATE POLICY "applications_select_own" ON public.host_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "applications_insert_own" ON public.host_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff admins can do everything with applications
CREATE POLICY "applications_all_staff" ON public.host_applications
  FOR ALL USING (public.is_staff_admin());

-- Indexes for staff review queue
CREATE INDEX IF NOT EXISTS idx_host_applications_status ON public.host_applications(status);
CREATE INDEX IF NOT EXISTS idx_host_applications_user_id ON public.host_applications(user_id);

-- ============================================================
-- 6. UPDATE ORG RLS: Only staff can INSERT organizations
-- ============================================================

DROP POLICY IF EXISTS "orgs_insert_any_auth_user" ON public.organizations;
DROP POLICY IF EXISTS "organization_members_insert" ON public.organization_members;

CREATE POLICY "orgs_insert_staff_only" ON public.organizations
  FOR INSERT WITH CHECK (public.is_staff_admin());

CREATE POLICY "org_members_insert_staff_only" ON public.organization_members
  FOR INSERT WITH CHECK (public.is_staff_admin());

-- ============================================================
-- 7. UPDATE ADMIN POLICIES TO USE is_staff_admin()
-- ============================================================

DROP POLICY IF EXISTS "orgs_select_admin" ON public.organizations;
CREATE POLICY "orgs_select_admin" ON public.organizations
  FOR SELECT USING (public.is_staff_admin());

DROP POLICY IF EXISTS "org_members_select_admin" ON public.organization_members;
CREATE POLICY "org_members_select_admin" ON public.organization_members
  FOR SELECT USING (public.is_staff_admin());

DROP POLICY IF EXISTS "orgs_update_admin" ON public.organizations;
CREATE POLICY "orgs_update_admin" ON public.organizations
  FOR UPDATE USING (public.is_staff_admin());

-- ============================================================
-- 8. CLAIM INVITE RPC (SECURITY DEFINER to bypass RLS for member insert)
-- ============================================================

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
      SELECT 1 FROM auth.users u
      WHERE u.id = v_user_id AND lower(u.email) = lower(v_invite.email)
    ) THEN
      RETURN jsonb_build_object('error', 'This invite is for a different email address');
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = v_invite.org_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'You are already a member of this organization');
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (v_invite.org_id, v_user_id, v_invite.role);

  UPDATE public.org_invites
    SET claimed_by = v_user_id, claimed_at = now()
    WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_invite.org_id,
    'role', v_invite.role
  );
END;
$$;

-- ============================================================
-- 9. UPDATE PROFILES RLS (protect both role_admin and platform_role)
-- ============================================================

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND platform_role = (SELECT platform_role FROM public.profiles WHERE id = auth.uid())
    AND role_admin = (SELECT role_admin FROM public.profiles WHERE id = auth.uid())
  );
