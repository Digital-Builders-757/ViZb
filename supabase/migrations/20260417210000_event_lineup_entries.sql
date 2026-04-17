-- Open Mic Lineup V1: performer order per event (see docs/OPEN_MIC_LINEUP.md).

CREATE TYPE public.lineup_entry_status AS ENUM (
  'pending',
  'confirmed',
  'performed',
  'no_show',
  'cancelled'
);

CREATE TABLE public.event_lineup_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  performer_name TEXT NOT NULL,
  stage_name TEXT,
  notes TEXT,
  slot_order INTEGER NOT NULL DEFAULT 0,
  status public.lineup_entry_status NOT NULL DEFAULT 'pending',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_lineup_entries_event_id ON public.event_lineup_entries(event_id);
CREATE INDEX idx_event_lineup_entries_event_slot ON public.event_lineup_entries(event_id, slot_order);

COMMENT ON TABLE public.event_lineup_entries IS 'Ordered open-mic (or future) lineup rows; public visibility and status gate anon reads.';

ALTER TABLE public.event_lineup_entries ENABLE ROW LEVEL SECURITY;

-- Anonymous + any authenticated user: published open-mic events only, public slice.
CREATE POLICY "lineup_select_public_slice" ON public.event_lineup_entries
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_lineup_entries.event_id
        AND e.status = 'published'
        AND e.categories @> ARRAY['open_mic']::text[]
    )
    AND event_lineup_entries.is_public = true
    AND event_lineup_entries.status IN ('confirmed', 'performed')
  );

-- Org editors + staff: full read for manageable events (dashboard).
CREATE POLICY "lineup_select_org_staff" ON public.event_lineup_entries
  FOR SELECT TO authenticated
  USING (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_lineup_entries.event_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "lineup_insert_org_staff" ON public.event_lineup_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_lineup_entries.event_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "lineup_update_org_staff" ON public.event_lineup_entries
  FOR UPDATE TO authenticated
  USING (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_lineup_entries.event_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_lineup_entries.event_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "lineup_delete_org_staff" ON public.event_lineup_entries
  FOR DELETE TO authenticated
  USING (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_lineup_entries.event_id
        AND om.user_id = (SELECT auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );
