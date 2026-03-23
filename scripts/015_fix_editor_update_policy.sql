-- Migration 015: Fix editor update RLS policy for submit-for-review
--
-- Problem: events_update_editor_own_draft has USING(status='draft') but no WITH CHECK.
-- PostgreSQL re-uses the USING clause as the implicit WITH CHECK.
-- When an editor updates status from 'draft' to 'pending_review', the NEW row
-- fails WITH CHECK because status is no longer 'draft', silently blocking the update.
--
-- Fix: Add explicit WITH CHECK that allows the resulting status to be either
-- 'draft' (normal edits) or 'pending_review' (submit for review).

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
  )
  WITH CHECK (
    -- Allow the row to remain draft (normal edits) or become pending_review (submit)
    status IN ('draft', 'pending_review')
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'editor'
    )
  );
