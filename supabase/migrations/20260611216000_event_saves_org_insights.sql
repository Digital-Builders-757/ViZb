-- Allow org members to read save rows for their events (organizer insights #160).

CREATE POLICY "event_saves_select_org_member" ON public.event_saves
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      INNER JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_saves.event_id
        AND om.user_id = auth.uid()
    )
  );
