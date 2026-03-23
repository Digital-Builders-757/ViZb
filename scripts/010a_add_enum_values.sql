-- ViBE: Add new enum values (must run in separate transaction)
-- Adds: platform_role type, new org_member_role values

-- 1. Platform role enum
DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM ('user', 'staff_admin', 'staff_support');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add new org_member_role values
DO $$ BEGIN ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'admin'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'editor'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'viewer'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
