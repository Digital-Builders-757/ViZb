-- Migration 023: Lock archived events (read-only) for org members
-- Staff admin can still update (for future unarchive / moderation tooling).

-- Drop and recreate update policies to prevent editing archived events.

DROP POLICY IF EXISTS "events_update_org_admin" ON public.events;
CREATE POLICY "events_update_org_admin" ON public.events
  FOR UPDATE TO authenticated
  USING (
    status <> 'archived'
    AND (
      EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = events.org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
      )
      OR is_staff_admin()
    )
  );

DROP POLICY IF EXISTS "events_update_editor_own_draft" ON public.events;
CREATE POLICY "events_update_editor_own_draft" ON public.events
  FOR UPDATE TO authenticated
  USING (
    status = 'draft'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'editor'
    )
  );
