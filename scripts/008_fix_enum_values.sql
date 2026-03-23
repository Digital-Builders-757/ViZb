-- ViBE: Fix enum value mismatches between DB and application code
-- SEVERITY: HIGH -- inserts will fail if enum values don't match
-- Addresses review items #5 (status vocabulary) and #6 (org_type mismatch)

-- =============================================================
-- FIX 1: org_status -- add 'pending_review' to match app code
-- Current: ('pending', 'active', 'suspended')
-- Needed:  ('pending_review', 'active', 'suspended')
-- The app uses 'pending_review' everywhere (org action, sidebar, admin page, organizer page)
-- =============================================================

ALTER TYPE org_status ADD VALUE IF NOT EXISTS 'pending_review';

-- =============================================================
-- FIX 2: org_type -- add missing values used by the create org form
-- Current: ('venue', 'partner', 'promoter')
-- Form uses: 'collective', 'venue', 'brand', 'nonprofit', 'independent'
-- Canonical set: collective, venue, brand, nonprofit, independent, partner, promoter
-- We ADD the missing values rather than replacing (non-destructive)
-- =============================================================

ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'collective';
ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'brand';
ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'nonprofit';
ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'independent';

-- =============================================================
-- FIX 3: event_status -- standardize on 'pending_review' to match org pattern
-- Current: ('draft', 'pending', 'published', 'cancelled')
-- Canonical: ('draft', 'pending_review', 'published', 'cancelled', 'rejected')
-- Add 'pending_review' and 'rejected' for Phase 2 event approval flow
-- =============================================================

ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'rejected';
