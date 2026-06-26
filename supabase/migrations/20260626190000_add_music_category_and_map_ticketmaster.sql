-- Add `music` to the public event taxonomy and convert existing Ticketmaster
-- candidate classifications into ViZb-safe category slugs.

BEGIN;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_categories_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_categories_check CHECK (
    cardinality(categories) >= 1
    AND categories <@ ARRAY[
      'party',
      'workshop',
      'networking',
      'social',
      'music',
      'concert',
      'other',
      'open_mic'
    ]::text[]
  );

COMMENT ON COLUMN public.events.categories IS
  'One or more of: party, workshop, networking, social, music, concert, other, open_mic.';

WITH ticketmaster_source AS (
  SELECT
    id,
    lower(
      concat_ws(
        ' ',
        coalesce(title, ''),
        coalesce(classifications ->> 'segment', ''),
        coalesce(classifications ->> 'genre', ''),
        coalesce(classifications ->> 'subGenre', ''),
        coalesce(array_to_string(categories, ' '), '')
      )
    ) AS search_text
  FROM public.event_candidates
  WHERE source_key = 'ticketmaster'
),
flags AS (
  SELECT
    id,
    search_text,
    search_text ~ 'open[- ]mic' AS is_open_mic,
    search_text ~ '(workshop|master ?class|boot ?camp|training|seminar)' AS is_workshop,
    search_text ~ '(networking|business mixer|network mixer|career fair|job fair|professional mixer|business conference|business summit)' AS is_networking,
    search_text ~ '(after ?party|day party|club night|nightclub|party)' AS is_party,
    search_text ~ '(meet ?up|community gathering|social gathering|festival|family)' AS is_social,
    search_text ~ '(^|[^a-z0-9])(music|rock|pop|jazz|blues|country|hip[- ]?hop|rap|r&b|rnb|soul|reggae|latin|electronic|metal|folk|classical|gospel|alternative|indie|punk)([^a-z0-9]|$)' AS is_music,
    search_text ~ '(concert|in concert|live music)' AS is_explicit_concert
  FROM ticketmaster_source
),
mapped AS (
  SELECT
    id,
    (
      CASE WHEN is_party THEN ARRAY['party']::text[] ELSE ARRAY[]::text[] END
      || CASE WHEN is_workshop THEN ARRAY['workshop']::text[] ELSE ARRAY[]::text[] END
      || CASE WHEN is_networking THEN ARRAY['networking']::text[] ELSE ARRAY[]::text[] END
      || CASE WHEN is_social THEN ARRAY['social']::text[] ELSE ARRAY[]::text[] END
      || CASE WHEN is_music THEN ARRAY['music']::text[] ELSE ARRAY[]::text[] END
      || CASE
           WHEN is_explicit_concert
             OR (is_music AND NOT is_party AND NOT is_workshop AND NOT is_networking AND NOT is_open_mic)
           THEN ARRAY['concert']::text[]
           ELSE ARRAY[]::text[]
         END
      || CASE WHEN is_open_mic THEN ARRAY['open_mic']::text[] ELSE ARRAY[]::text[] END
    ) AS categories
  FROM flags
)
UPDATE public.event_candidates AS candidate
SET
  categories = CASE
    WHEN cardinality(mapped.categories) > 0 THEN mapped.categories
    ELSE ARRAY['other']::text[]
  END,
  updated_at = now()
FROM mapped
WHERE candidate.id = mapped.id;

COMMIT;
