-- Per-user saved published events ("My Vibes") for planner + timeline filters.

CREATE TABLE IF NOT EXISTS public.event_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_saves_user_event_unique UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_saves_user_created_at ON public.event_saves (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_saves_event_id ON public.event_saves (event_id);

ALTER TABLE public.event_saves ENABLE ROW LEVEL SECURITY;

-- Users read only their own saves.
CREATE POLICY "event_saves_select_own" ON public.event_saves
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users insert saves only for themselves; event must be published.
CREATE POLICY "event_saves_insert_own_published" ON public.event_saves
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_saves.event_id
        AND e.status = 'published'
    )
  );

-- Users delete only their own saves.
CREATE POLICY "event_saves_delete_own" ON public.event_saves
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
