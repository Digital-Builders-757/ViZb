-- Migration 025: Event registrations (Free RSVP foundation)
-- Adds a minimal ticketing/RSVP primitive that can later support paid tickets + check-in.

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- MVP status model: keep as TEXT for forward flexibility; enforce allowed values.
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'checked_in')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,

  CONSTRAINT event_registrations_unique_event_user UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Read: user can see their own registrations.
CREATE POLICY "event_registrations_select_own" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Read: org members can see registrations for their org events.
CREATE POLICY "event_registrations_select_org" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND is_org_member(e.org_id)
    )
  );

-- Read: staff can see all registrations.
CREATE POLICY "event_registrations_select_staff" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (is_staff_admin());

-- Insert: authenticated users can RSVP for published events.
CREATE POLICY "event_registrations_insert_rsvp" ON public.event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND e.status = 'published'
    )
  );

-- Update: user can cancel their RSVP (and re-confirm later).
CREATE POLICY "event_registrations_update_own" ON public.event_registrations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Update: staff/admin can check-in attendees.
CREATE POLICY "event_registrations_update_staff_or_org_admin" ON public.event_registrations
  FOR UPDATE TO authenticated
  USING (
    is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_registrations.event_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (true);
