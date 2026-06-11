-- Link published posts as event recaps (#159).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recap_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_recap_post_id ON public.events (recap_post_id)
  WHERE recap_post_id IS NOT NULL;

COMMENT ON COLUMN public.events.recap_post_id IS
  'Optional published post recap surfaced on past event detail and ticket wallet.';
