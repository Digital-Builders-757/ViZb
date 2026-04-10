-- Mirror of supabase/migrations/20260410120000_event_rsvp_capacity.sql
-- RSVP capacity for free events (see migration file for full comments).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp_capacity integer;

COMMENT ON COLUMN public.events.rsvp_capacity IS
  'Max attendees for free RSVP (confirmed + checked_in). NULL means no limit.';

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_rsvp_capacity_positive;

ALTER TABLE public.events
  ADD CONSTRAINT events_rsvp_capacity_positive
  CHECK (rsvp_capacity IS NULL OR rsvp_capacity > 0);

CREATE OR REPLACE FUNCTION public.published_event_rsvp_occupied_count(p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = p_event_id AND e.status = 'published'
    ) THEN (
      SELECT COUNT(*)::int
      FROM public.event_registrations er
      WHERE er.event_id = p_event_id
        AND er.status IN ('confirmed', 'checked_in')
    )
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.published_event_rsvp_occupied_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.published_event_rsvp_occupied_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.published_event_rsvp_occupied_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.published_event_rsvp_occupied_count(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_event_rsvp_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap integer;
  occupied integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('confirmed', 'checked_in') THEN
      RETURN NEW;
    END IF;

    SELECT e.rsvp_capacity INTO cap
    FROM public.events e WHERE e.id = NEW.event_id;

    IF cap IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT COUNT(*)::int INTO occupied
    FROM public.event_registrations er
    WHERE er.event_id = NEW.event_id
      AND er.status IN ('confirmed', 'checked_in');

    IF occupied >= cap THEN
      RAISE EXCEPTION 'RSVP capacity is full for this event'
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status IN ('confirmed', 'checked_in')
     AND OLD.status IN ('confirmed', 'checked_in') THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('confirmed', 'checked_in')
     AND NEW.status NOT IN ('confirmed', 'checked_in') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('confirmed', 'checked_in')
     AND OLD.status NOT IN ('confirmed', 'checked_in') THEN

    SELECT e.rsvp_capacity INTO cap
    FROM public.events e WHERE e.id = NEW.event_id;

    IF cap IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT COUNT(*)::int INTO occupied
    FROM public.event_registrations er
    WHERE er.event_id = NEW.event_id
      AND er.status IN ('confirmed', 'checked_in')
      AND er.id IS DISTINCT FROM NEW.id;

    IF occupied >= cap THEN
      RAISE EXCEPTION 'RSVP capacity is full for this event'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_event_rsvp_capacity ON public.event_registrations;

CREATE TRIGGER trg_enforce_event_rsvp_capacity
  BEFORE INSERT OR UPDATE OF status ON public.event_registrations
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_event_rsvp_capacity();
