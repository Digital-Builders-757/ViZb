-- Organizer analytics: coarse public detail page opens (privacy-light; no per-user profiling).
-- Incremented via SECURITY DEFINER RPC so anonymous visitors cannot broad UPDATE events under RLS.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS public_detail_view_count bigint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.events.public_detail_view_count IS
  'Monotonic counter of POST /api/events/[slug]/view beacons while event was published (approximate).';

CREATE OR REPLACE FUNCTION public.increment_event_public_detail_views(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s text := trim(coalesce(p_slug, ''));
BEGIN
  IF s = '' THEN
    RETURN;
  END IF;

  UPDATE public.events
  SET public_detail_view_count = public_detail_view_count + 1
  WHERE slug = s
    AND status = 'published'::public.event_status;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_event_public_detail_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_event_public_detail_views(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_event_public_detail_views(text) TO authenticated;
