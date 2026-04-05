-- Migration 024: Allow staff admins to update archived events (for unarchive/moderation)
-- Fixes migration 023 policy logic which unintentionally blocked staff from updating archived rows.

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
  );
