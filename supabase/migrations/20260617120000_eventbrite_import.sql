-- Eventbrite import tracking (#259): source fields on events + import run audit table.

-- ---------------------------------------------------------------------------
-- events: external source metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_event_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_payload jsonb,
  ADD COLUMN IF NOT EXISTS import_status text,
  ADD COLUMN IF NOT EXISTS last_imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

COMMENT ON COLUMN public.events.source IS 'Import origin key, e.g. eventbrite.';
COMMENT ON COLUMN public.events.source_event_id IS 'Stable id from the upstream provider.';
COMMENT ON COLUMN public.events.source_payload IS 'Raw upstream JSON for re-import diffing.';
COMMENT ON COLUMN public.events.import_status IS 'Import queue state: pending_review, approved, rejected.';

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_import_status_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_import_status_check
  CHECK (
    import_status IS NULL
    OR import_status IN ('pending_review', 'approved', 'rejected')
  );

CREATE UNIQUE INDEX IF NOT EXISTS events_source_source_event_id_unique
  ON public.events (source, source_event_id)
  WHERE source IS NOT NULL AND source_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_import_queue
  ON public.events (source, import_status, last_imported_at DESC)
  WHERE source IS NOT NULL;

-- ---------------------------------------------------------------------------
-- event_import_runs: audit each import job
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'eventbrite',
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  events_found integer NOT NULL DEFAULT 0,
  events_created integer NOT NULL DEFAULT 0,
  events_updated integer NOT NULL DEFAULT 0,
  events_skipped integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT event_import_runs_status_check
    CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_event_import_runs_started_at
  ON public.event_import_runs (started_at DESC);

ALTER TABLE public.event_import_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_import_runs_select_staff ON public.event_import_runs;

CREATE POLICY event_import_runs_select_staff ON public.event_import_runs
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

-- Writes use service role (bypasses RLS).
