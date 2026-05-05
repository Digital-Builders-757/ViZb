-- Item 6 — trust signals: staff editorial highlight + user-submitted listing reports.
-- is_staff_pick: surfaced as "Staff pick" on discovery/detail; staff_admin updates via existing events UPDATE policy.
-- event_listing_reports: authenticated users file one report per listing (unique event_id + user_id).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_staff_pick boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.is_staff_pick IS
  'ViZb editorial highlight (Staff pick). Shown on discovery and event detail; toggled by staff_admin.';

CREATE TABLE IF NOT EXISTS public.event_listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_listing_reports_body_len CHECK (
    char_length(trim(body)) >= 10 AND char_length(body) <= 2000
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS event_listing_reports_event_user_uidx
  ON public.event_listing_reports (event_id, user_id);

CREATE INDEX IF NOT EXISTS event_listing_reports_created_at_idx
  ON public.event_listing_reports (created_at DESC);

ALTER TABLE public.event_listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_listing_reports_insert_own ON public.event_listing_reports;

CREATE POLICY event_listing_reports_insert_own
  ON public.event_listing_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_listing_reports.event_id
        AND e.status = 'published'
    )
  );

DROP POLICY IF EXISTS event_listing_reports_select_staff ON public.event_listing_reports;

CREATE POLICY event_listing_reports_select_staff
  ON public.event_listing_reports
  FOR SELECT
  TO authenticated
  USING (public.is_staff_admin());
