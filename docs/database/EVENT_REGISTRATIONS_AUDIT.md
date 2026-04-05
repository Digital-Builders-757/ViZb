# Event registrations — integrity and admin audit

**Related migration:** `supabase/migrations/20260405191000_event_registrations_status_timestamp_checks.sql`  
**Base table:** `supabase/migrations/20260405171450_create_event_registrations.sql`

## What the migration adds

PostgreSQL `CHECK` constraints so:

- `status = 'cancelled'` implies `cancelled_at IS NOT NULL`
- `status = 'checked_in'` implies `checked_in_at IS NOT NULL`
- `status = 'confirmed'` implies both `cancelled_at` and `checked_in_at` are NULL

Existing allowed statuses remain enforced on the column: `confirmed`, `cancelled`, `checked_in`.  
**RLS policies are unchanged** by this migration.

---

## Preconditions (run before `supabase db push` in prod)

If any query returns rows, fix data (or cancel the migration) before adding constraints.

```sql
-- Cancelled without timestamp
SELECT id, event_id, user_id, status, cancelled_at, checked_in_at, updated_at
FROM public.event_registrations
WHERE status = 'cancelled' AND cancelled_at IS NULL;

-- Checked in without timestamp
SELECT id, event_id, user_id, status, cancelled_at, checked_in_at, updated_at
FROM public.event_registrations
WHERE status = 'checked_in' AND checked_in_at IS NULL;

-- Confirmed but still carrying terminal timestamps
SELECT id, event_id, user_id, status, cancelled_at, checked_in_at, updated_at
FROM public.event_registrations
WHERE status = 'confirmed' AND (cancelled_at IS NOT NULL OR checked_in_at IS NOT NULL);
```

Example repair (adjust per row after human review):

```sql
-- Example: backfill cancelled_at for stuck cancelled rows
UPDATE public.event_registrations
SET cancelled_at = COALESCE(cancelled_at, updated_at, created_at)
WHERE status = 'cancelled' AND cancelled_at IS NULL;

-- Example: backfill checked_in_at for stuck checked-in rows
UPDATE public.event_registrations
SET checked_in_at = COALESCE(checked_in_at, updated_at, created_at)
WHERE status = 'checked_in' AND checked_in_at IS NULL;
```

---

## Post-migration verification

```sql
SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.event_registrations'::regclass
  AND contype = 'c'
ORDER BY conname;
```

Expect constraint names:

- `event_registrations_cancelled_requires_cancelled_at`
- `event_registrations_checked_in_requires_checked_in_at`
- `event_registrations_confirmed_clears_status_timestamps`
- (existing) `event_registrations_status_check` or inline status check from table create

---

## Admin / support rollups

**RSVP counts per event** (staff or org policy permitting):

```sql
SELECT
  event_id,
  status,
  COUNT(*) AS n
FROM public.event_registrations
GROUP BY event_id, status
ORDER BY event_id, status;
```

**Duplicate user rows** (should always be empty — unique on `(event_id, user_id)`):

```sql
SELECT event_id, user_id, COUNT(*) AS n
FROM public.event_registrations
GROUP BY event_id, user_id
HAVING COUNT(*) > 1;
```

**Unexpected status values** (should be empty):

```sql
SELECT DISTINCT status
FROM public.event_registrations
WHERE status NOT IN ('confirmed', 'cancelled', 'checked_in');
```

---

## UI note

There is no dedicated admin “debug panel” for RSVPs in the app shell; use the SQL editor in Supabase (service role / SQL) with the snippets above. Future admin tooling can embed read-only views of these queries behind `staff_admin` RLS.
