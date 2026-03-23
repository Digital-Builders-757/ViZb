-- ViBE Phase 1: Create all enum types
-- Spec Reference: VIBE_APP_SPECIFICATION.md Section 5.1

DO $$ BEGIN
  CREATE TYPE org_type AS ENUM ('venue', 'partner', 'promoter');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE org_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE org_member_role AS ENUM ('owner', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'pending', 'published', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_kind AS ENUM ('flyer', 'gallery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
