-- Discriminator for ViZb-hosted vs third-party listings; optional off-platform RSVP link for community events.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_kind text NOT NULL DEFAULT 'official';

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_rsvp_url text;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_kind_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_event_kind_check CHECK (event_kind IN ('official', 'community'));

COMMENT ON COLUMN public.events.event_kind IS
  'official = ViZb-hosted event flow; community = listed for discovery, RSVP may be external.';

COMMENT ON COLUMN public.events.external_rsvp_url IS
  'HTTPS or HTTP URL to host RSVP page; required for community events before review/publish.';
