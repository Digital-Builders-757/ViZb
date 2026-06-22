-- Event ingestion foundation (#266): source registry, event candidates, review audit, import run extensions.

-- ---------------------------------------------------------------------------
-- event_sources: staff-visible source registry and operational health
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_sources (
  source_key text PRIMARY KEY,
  display_name text NOT NULL,
  source_type text NOT NULL,
  description text,
  enabled_in_db boolean NOT NULL DEFAULT false,
  default_cadence_hours integer,
  attribution_label text,
  operational_notes text,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error_summary text,
  consecutive_failures integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_sources_cadence_positive
    CHECK (default_cadence_hours IS NULL OR default_cadence_hours > 0)
);

COMMENT ON TABLE public.event_sources IS 'Registry of supported event ingestion sources; env flags gate runtime execution.';
COMMENT ON COLUMN public.event_sources.enabled_in_db IS 'Registry enable flag; both this and per-source env flag must allow a run.';

INSERT INTO public.event_sources (
  source_key,
  display_name,
  source_type,
  description,
  enabled_in_db,
  default_cadence_hours,
  attribution_label,
  operational_notes
) VALUES
  (
    'eventbrite',
    'Eventbrite Organization',
    'partner_api',
    'Parked organization-owned Eventbrite sync (#259). Not geographic discovery.',
    false,
    6,
    'Eventbrite',
    'Keep EVENTBRITE_IMPORT_ENABLED=false until reactivation policy is met.'
  ),
  (
    'ticketmaster',
    'Ticketmaster Discovery',
    'public_api',
    'Public event discovery API for launch geography (#267).',
    false,
    6,
    'Ticketmaster',
    'Disabled until Ticketmaster adapter is implemented and verified.'
  ),
  (
    'ics_feed',
    'ICS Calendar Feed',
    'calendar_feed',
    'Trusted venue or calendar ICS feeds (#273).',
    false,
    24,
    NULL,
    'Registry-managed feeds; not enabled in foundation release.'
  ),
  (
    'url_import',
    'Staff URL Import',
    'url_metadata',
    'Staff-pasted public event URLs (#272).',
    false,
    NULL,
    NULL,
    'Manual staff workflow; no scheduled runs.'
  ),
  (
    'organizer_submission',
    'Organizer Submission',
    'native',
    'Direct organizer event submissions (#271).',
    false,
    NULL,
    'ViZb',
    'Native organizer flow; not an automated adapter run.'
  )
ON CONFLICT (source_key) DO NOTHING;

ALTER TABLE public.event_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_sources_select_staff ON public.event_sources;
CREATE POLICY event_sources_select_staff ON public.event_sources
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

-- Writes use service role (bypasses RLS).

-- ---------------------------------------------------------------------------
-- event_import_runs: extend for candidate-based ingestion (backward compatible)
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_import_runs
  ADD COLUMN IF NOT EXISTS candidates_found integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS candidates_created integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS candidates_updated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS candidates_skipped integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS environment text,
  ADD COLUMN IF NOT EXISTS trigger_type text,
  ADD COLUMN IF NOT EXISTS window_start timestamptz,
  ADD COLUMN IF NOT EXISTS window_end timestamptz;

COMMENT ON COLUMN public.event_import_runs.source IS 'Source key (alias for event_sources.source_key).';
COMMENT ON COLUMN public.event_import_runs.trigger_type IS 'manual or cron';
COMMENT ON COLUMN public.event_import_runs.candidates_found IS 'Normalized records processed in candidate-based runs.';

ALTER TABLE public.event_import_runs DROP CONSTRAINT IF EXISTS event_import_runs_trigger_type_check;
ALTER TABLE public.event_import_runs
  ADD CONSTRAINT event_import_runs_trigger_type_check
  CHECK (trigger_type IS NULL OR trigger_type IN ('manual', 'cron'));

-- ---------------------------------------------------------------------------
-- event_candidates: normalized staging records awaiting moderation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL REFERENCES public.event_sources(source_key) ON DELETE RESTRICT,
  source_event_id text NOT NULL,
  source_url text,
  source_attribution text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_payload_hash text,
  source_status text,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  timezone text,
  venue_name text,
  address text,
  city text,
  region text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  image_url text,
  categories text[] NOT NULL DEFAULT '{}'::text[],
  classifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  organizer_hints jsonb NOT NULL DEFAULT '{}'::jsonb,
  external_ticket_url text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_imported_at timestamptz NOT NULL DEFAULT now(),
  review_status text NOT NULL DEFAULT 'pending_review',
  duplicate_status text NOT NULL DEFAULT 'none',
  canonical_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  duplicate_match_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text,
  suppressed_until timestamptz,
  last_import_run_id uuid REFERENCES public.event_import_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_candidates_source_identity_unique UNIQUE (source_key, source_event_id),
  CONSTRAINT event_candidates_review_status_check
    CHECK (
      review_status IN (
        'pending_review',
        'needs_changes',
        'approved_listing',
        'rejected',
        'suppressed',
        'stale',
        'cancelled',
        'merged'
      )
    ),
  CONSTRAINT event_candidates_duplicate_status_check
    CHECK (duplicate_status IN ('none', 'exact', 'likely'))
);

CREATE INDEX IF NOT EXISTS idx_event_candidates_review_queue
  ON public.event_candidates (review_status, last_imported_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_candidates_canonical_event
  ON public.event_candidates (canonical_event_id)
  WHERE canonical_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_candidates_duplicate_status
  ON public.event_candidates (duplicate_status)
  WHERE duplicate_status <> 'none';

CREATE INDEX IF NOT EXISTS idx_event_candidates_source_key
  ON public.event_candidates (source_key, last_seen_at DESC);

COMMENT ON TABLE public.event_candidates IS 'Normalized event records from external sources; not canonical public events until staff approval (#266).';

ALTER TABLE public.event_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_candidates_select_staff ON public.event_candidates;
CREATE POLICY event_candidates_select_staff ON public.event_candidates
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

-- Writes use service role (bypasses RLS).

-- ---------------------------------------------------------------------------
-- event_candidate_reviews: immutable moderation and import audit history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_candidate_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.event_candidates(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  previous_review_status text,
  new_review_status text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_candidate_reviews_action_check
    CHECK (
      action IN (
        'system_import',
        'staff_edit',
        'approve',
        'reject',
        'suppress',
        'link',
        'merge',
        'dismiss_duplicate',
        'undo'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_event_candidate_reviews_candidate
  ON public.event_candidate_reviews (candidate_id, created_at DESC);

ALTER TABLE public.event_candidate_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_candidate_reviews_select_staff ON public.event_candidate_reviews;
CREATE POLICY event_candidate_reviews_select_staff ON public.event_candidate_reviews
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

-- Inserts via service role and future staff actions.
