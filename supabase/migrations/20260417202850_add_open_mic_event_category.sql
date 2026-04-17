-- Add `open_mic` to allowed event category tags on `events.categories` (non-destructive: extends CHECK only).

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_categories_check;

ALTER TABLE public.events ADD CONSTRAINT events_categories_check CHECK (
  cardinality(categories) >= 1
  AND categories <@ ARRAY[
    'party',
    'workshop',
    'networking',
    'social',
    'concert',
    'other',
    'open_mic'
  ]::text[]
);

COMMENT ON COLUMN public.events.categories IS 'One or more of: party, workshop, networking, social, concert, other, open_mic.';
