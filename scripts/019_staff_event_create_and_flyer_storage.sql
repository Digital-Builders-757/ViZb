-- Migration 019: Staff admins can create events for any org and upload flyers
-- Rationale: requireOrgMember() already lets staff open /organizer/:slug/*, but RLS + storage
-- policies blocked INSERT without a real organization_members row. This aligns DB with that UX.

-- EVENTS: platform staff may insert on behalf of any existing organization
DROP POLICY IF EXISTS "events_insert_staff" ON public.events;
CREATE POLICY "events_insert_staff" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff_admin()
    AND created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = events.org_id)
  );

-- STORAGE: allow staff to upload/update flyers under event-flyers/{org_id}/...
-- Path format matches 014: (storage.foldername(name))[1] = org_id uuid
DROP POLICY IF EXISTS "event_flyers_insert_org_member" ON storage.objects;
CREATE POLICY "event_flyers_insert_org_member" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-flyers'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = (storage.foldername(name))[1]::uuid
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin', 'editor')
      )
      OR public.is_staff_admin()
    )
  );

DROP POLICY IF EXISTS "event_flyers_update_org_member" ON storage.objects;
CREATE POLICY "event_flyers_update_org_member" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-flyers'
    AND (
      EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = (storage.foldername(name))[1]::uuid
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin', 'editor')
      )
      OR public.is_staff_admin()
    )
  );
