-- Migration 020: Multiple categories per event (replaces single category TEXT).
-- Existing rows become a one-element array; app + RLS unchanged (column-level policies N/A).

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS categories TEXT[];

UPDATE public.events SET categories = ARRAY[category] WHERE categories IS NULL;

ALTER TABLE public.events ALTER COLUMN categories SET NOT NULL;

ALTER TABLE public.events ADD CONSTRAINT events_categories_check CHECK (
  cardinality(categories) >= 1
  AND categories <@ ARRAY['party','workshop','networking','social','concert','other']::text[]
);

-- Drops the legacy CHECK on category along with the column
ALTER TABLE public.events DROP COLUMN IF EXISTS category;

CREATE INDEX IF NOT EXISTS idx_events_categories_gin ON public.events USING GIN (categories);

COMMENT ON COLUMN public.events.categories IS 'One or more of: party, workshop, networking, social, concert, other.';
