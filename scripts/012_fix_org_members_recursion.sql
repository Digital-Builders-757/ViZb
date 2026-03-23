-- Migration 012: Fix infinite recursion in organization_members RLS policies
-- Problem: policies on organization_members query organization_members itself,
-- causing infinite recursion when Postgres evaluates the policy.
-- Fix: SECURITY DEFINER helper functions that bypass RLS for membership checks.

-- Step 1: Create helper functions (SECURITY DEFINER bypasses RLS)

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
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
    SELECT 1 FROM organization_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND role = 'owner'::org_member_role
  );
$$;

-- Step 2: Drop the recursive policies

DROP POLICY IF EXISTS "org_members_select_same_org" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete_owner" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update_owner" ON public.organization_members;

-- Step 3: Recreate with function-based checks (no self-reference)

CREATE POLICY "org_members_select_same_org"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (is_org_member(org_id));

CREATE POLICY "org_members_delete_owner"
  ON public.organization_members FOR DELETE
  TO authenticated
  USING (is_org_owner(org_id));

CREATE POLICY "org_members_update_owner"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (is_org_owner(org_id));

-- Step 4: Also fix organizations table policies that may have the same pattern
-- Check and replace any self-referencing policies on organizations

DROP POLICY IF EXISTS "orgs_select_member" ON public.organizations;

CREATE POLICY "orgs_select_member"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (is_org_member(id));

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;
