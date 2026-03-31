-- =============================================================================
-- VERIFY 019 + 020 on a Supabase project (read-only)
-- =============================================================================
-- Run in: Supabase Dashboard → SQL Editor → Production (or any project).
-- Safe: SELECTs only. Use results to confirm schema matches repo scripts:
--   scripts/019_staff_event_create_and_flyer_storage.sql
--   scripts/020_event_categories_array.sql
--
-- Expected after BOTH are applied:
--   020: public.events has column `categories` (text[]), NOT `category`.
--   019: RLS policy `events_insert_staff` on public.events; storage policies
--        on `storage.objects` for bucket `event-flyers` include staff OR branch.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A) 020 — events.categories + legacy category gone
-- ---------------------------------------------------------------------------
SELECT
  '020 columns on public.events' AS check_id,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events'
  AND column_name IN ('categories', 'category')
ORDER BY column_name;

-- Pass: one row for `categories` (udt_name often `_text`). Fail for app: row for `category` still present after 020.

SELECT
  '020 constraint events_categories_check' AS check_id,
  conname AS constraint_name
FROM pg_constraint
WHERE conrelid = 'public.events'::regclass
  AND conname = 'events_categories_check';

-- Pass: exactly one row.

SELECT
  '020 index idx_events_categories_gin' AS check_id,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'events'
  AND indexname = 'idx_events_categories_gin';

-- Pass: one row (GIN on categories).

-- ---------------------------------------------------------------------------
-- B) 019 — staff insert events + staff flyer storage
-- ---------------------------------------------------------------------------
SELECT
  '019 events_insert_staff policy' AS check_id,
  policyname,
  cmd AS command,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'events'
  AND policyname = 'events_insert_staff';

-- Pass: one row, command INSERT, roles includes authenticated (or {public} — check your PG version display).

-- 019 replaces event_flyers_* policies to add OR is_staff_admin() — names stay the same.
SELECT
  '019 storage policies (event-flyers path)' AS check_id,
  policyname,
  cmd AS command
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'event_flyers_insert_org_member',
    'event_flyers_update_org_member'
  )
ORDER BY policyname;

-- Pass: two rows (INSERT + UPDATE). If missing, staff flyer upload may fail RLS.

-- Optional: confirm policy definitions mention staff (text search — heuristic)
SELECT
  '019 storage policy definitions (snippet)' AS check_id,
  policyname,
  left(coalesce(qual::text, '') || coalesce(with_check::text, ''), 200) AS definition_snippet
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'event_flyers_insert_org_member',
    'event_flyers_update_org_member'
  )
ORDER BY policyname;

-- Pass: snippets include is_staff_admin (or your SQL may show function OID). If only org_member EXISTS and no staff, 019 may not be applied.
