-- ViBE Phase 1: RLS Security Fixes
-- Fix 1: Prevent users from self-promoting to role_admin via profile update
-- Fix 2: Allow admins to read all orgs (including pending) for admin dashboard
-- Fix 3: Allow admins to read all org_members for admin dashboard

-- ============================================================
-- FIX 1: Profiles update policy -- block role_admin self-promotion
-- ============================================================

-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Re-create with a WITH CHECK that ensures role_admin cannot be changed by the user.
-- The user can update their own row, but only if role_admin stays the same.
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role_admin = (SELECT role_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- FIX 2: Admin can read ALL organizations (regardless of status/membership)
-- ============================================================

CREATE POLICY "orgs_select_admin"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_admin = true
    )
  );

-- ============================================================
-- FIX 3: Admin can read ALL organization members
-- ============================================================

CREATE POLICY "org_members_select_admin"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_admin = true
    )
  );

-- ============================================================
-- FIX 4: Admin can update organizations (for approvals)
-- ============================================================

CREATE POLICY "orgs_update_admin"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_admin = true
    )
  );
