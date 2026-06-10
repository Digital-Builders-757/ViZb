-- Migration 030: Fix event archive RLS WITH CHECK (see supabase/migrations/20260610043000_fix_event_archive_rls_with_check.sql)

ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'archived';

DROP POLICY IF EXISTS "events_update_org_admin" ON public.events;
CREATE POLICY "events_update_org_admin" ON public.events
  FOR UPDATE TO authenticated
  USING (
    is_staff_admin()
    OR (
      status <> 'archived'
      AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = events.org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    is_staff_admin()
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "events_update_staff" ON public.events;
CREATE POLICY "events_update_staff" ON public.events
  FOR UPDATE TO authenticated
  USING (is_staff_admin())
  WITH CHECK (is_staff_admin());
