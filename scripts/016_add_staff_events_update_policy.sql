-- Migration 016: Allow staff admins to update events (approve/reject)
-- The events_select_staff policy already exists for reading.
-- This adds the matching UPDATE policy so staff can change event status.

DROP POLICY IF EXISTS "events_update_staff" ON public.events;
CREATE POLICY "events_update_staff" ON public.events
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role = 'staff_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.platform_role = 'staff_admin'
    )
  );
