-- ViBE Phase 1: Column Privilege Hardening
-- Adds defense-in-depth: even if RLS policies are loosened in the future,
-- users physically cannot UPDATE the role_admin column.
--
-- This is the "hard lock" complement to the RLS WITH CHECK in migration 006.

-- ============================================================
-- COLUMN PRIVILEGE: Revoke UPDATE on role_admin from authenticated users
-- ============================================================

-- First, grant UPDATE on the specific columns users ARE allowed to change.
-- This implicitly revokes UPDATE on all other columns (like role_admin).
-- 
-- The authenticated role can only UPDATE these columns on profiles:
--   display_name, avatar_url, updated_at
--
-- role_admin can ONLY be changed by the service_role (i.e., admin tooling / triggers).

REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (display_name, avatar_url, updated_at)
  ON public.profiles TO authenticated;

-- Verify: authenticated users can still SELECT all columns (read is fine)
-- The service_role retains full UPDATE access for admin tooling.

-- ============================================================
-- ADMIN POLICY HARDENING: Ensure policies are scoped to authenticated role
-- ============================================================

-- The existing admin policies already use auth.uid() which is only populated
-- for authenticated sessions. But let's add explicit comments documenting this
-- and ensure the policies reference the DB-stored role_admin (which the user
-- cannot edit due to the column privilege above).
--
-- No SQL changes needed here -- the existing policies in 006 are correctly
-- structured. The column privilege above is the belt-and-suspenders guarantee.
