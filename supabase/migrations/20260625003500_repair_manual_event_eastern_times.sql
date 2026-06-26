-- Repair manually created events where datetime-local values were stored as UTC
-- instead of Eastern (America/New_York) wall time.
-- Imported events (source IS NOT NULL) already have correct UTC instants — excluded.

ALTER TABLE public.ticket_types
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.events
SET
  starts_at = ((starts_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'),
  ends_at = CASE
    WHEN ends_at IS NOT NULL THEN ((ends_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York')
    ELSE NULL
  END,
  updated_at = now()
WHERE source IS NULL
  AND starts_at IS NOT NULL
  AND starts_at <> ((starts_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York');

-- Same naive-UTC bug may affect ticket sales windows on manual events.
UPDATE public.ticket_types AS tt
SET
  sales_starts_at = CASE
    WHEN tt.sales_starts_at IS NOT NULL
      THEN ((tt.sales_starts_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York')
    ELSE NULL
  END,
  sales_ends_at = CASE
    WHEN tt.sales_ends_at IS NOT NULL
      THEN ((tt.sales_ends_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York')
    ELSE NULL
  END,
  sales_start_at = CASE
    WHEN tt.sales_start_at IS NOT NULL
      THEN ((tt.sales_start_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York')
    ELSE NULL
  END,
  sales_end_at = CASE
    WHEN tt.sales_end_at IS NOT NULL
      THEN ((tt.sales_end_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York')
    ELSE NULL
  END,
  updated_at = now()
FROM public.events AS e
WHERE tt.event_id = e.id
  AND e.source IS NULL
  AND (
    (tt.sales_starts_at IS NOT NULL AND tt.sales_starts_at <> ((tt.sales_starts_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'))
    OR (tt.sales_ends_at IS NOT NULL AND tt.sales_ends_at <> ((tt.sales_ends_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'))
    OR (tt.sales_start_at IS NOT NULL AND tt.sales_start_at <> ((tt.sales_start_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'))
    OR (tt.sales_end_at IS NOT NULL AND tt.sales_end_at <> ((tt.sales_end_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'))
  );
