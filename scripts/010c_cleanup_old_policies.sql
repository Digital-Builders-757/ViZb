-- ViBE: Clean up old permissive policies that conflict with staff-only model
-- The old "orgs_insert_authenticated" allowed any user to create orgs
-- The old "org_members_insert_self" allowed any user to add themselves to orgs

DROP POLICY IF EXISTS "orgs_insert_authenticated" ON public.organizations;
DROP POLICY IF EXISTS "org_members_insert_self" ON public.organization_members;
