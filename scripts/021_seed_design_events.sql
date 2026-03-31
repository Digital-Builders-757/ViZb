-- =============================================================================
-- 021 — Design / preview seed data (published events)
-- =============================================================================
-- Purpose: Populate the app with realistic Virginia/DMV-style events for UI/design
-- work (dashboard, /events timeline, category filters).
--
-- How to run: Supabase Dashboard → SQL Editor → paste → Run.
-- Role: postgres (table owner) — bypasses RLS, same as other maintenance scripts.
--
-- Preconditions:
--   • At least one row in auth.users (sign up once in the app on this project).
--   • Schema through 020 applied (events.categories TEXT[], no legacy category).
--
-- Safety:
--   • Idempotent: uses org slug `vibe-design-preview` and ON CONFLICT DO NOTHING
--     on (org_id, slug) for events.
--   • Intended for local/staging. Do not run on production unless you accept
--     a design org + mock events in the live catalog.
--
-- Cleanup (optional):
--   DELETE FROM public.events WHERE org_id IN (SELECT id FROM organizations WHERE slug = 'vibe-design-preview');
--   DELETE FROM public.organization_members WHERE org_id IN (SELECT id FROM organizations WHERE slug = 'vibe-design-preview');
--   DELETE FROM public.organizations WHERE slug = 'vibe-design-preview';
-- =============================================================================

-- 1) Design-only org (active so public org join in API works)
INSERT INTO public.organizations (name, slug, type, status, description)
SELECT
  'ViZb Design Preview',
  'vibe-design-preview',
  'collective'::public.org_type,
  'active'::public.org_status,
  'Seeded mock events for layout and visual design. Remove this org when you no longer need fixtures.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.slug = 'vibe-design-preview'
);

-- 2) Link the earliest auth user as owner (so organizer flows stay coherent)
INSERT INTO public.organization_members (org_id, user_id, role)
SELECT o.id, u.id, 'owner'::public.org_member_role
FROM public.organizations o
CROSS JOIN LATERAL (
  SELECT id FROM auth.users ORDER BY created_at ASC NULLS LAST LIMIT 1
) u
WHERE o.slug = 'vibe-design-preview'
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 3) Published events — times relative to `now()` so the feed stays “alive”
INSERT INTO public.events (
  org_id,
  title,
  slug,
  description,
  starts_at,
  ends_at,
  venue_name,
  address,
  city,
  categories,
  status,
  flyer_url,
  created_by,
  published_at,
  updated_at
)
SELECT
  c.org_id,
  v.title,
  v.slug,
  v.description,
  v.starts_at,
  v.ends_at,
  v.venue_name,
  v.address,
  v.city,
  v.categories,
  'published'::public.event_status,
  v.flyer_url,
  c.user_id,
  now(),
  now()
FROM (
  SELECT
    o.id AS org_id,
    u.id AS user_id
  FROM public.organizations o
  CROSS JOIN LATERAL (
    SELECT id FROM auth.users ORDER BY created_at ASC NULLS LAST LIMIT 1
  ) u
  WHERE o.slug = 'vibe-design-preview'
) c
CROSS JOIN LATERAL (
  VALUES
    (
      'Norfolk Harbor After Dark',
      'seed-norfolk-harbor-after-dark',
      'DJ sets, food trucks, and waterfront lights. 21+.',
      now() + interval '2 days',
      now() + interval '2 days' + interval '5 hours',
      'Town Point Park',
      '113 Waterside Dr',
      'Norfolk',
      ARRAY['party', 'social']::text[],
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80'
    ),
    (
      'Richmond Creative Mixer',
      'seed-richmond-creative-mixer',
      'Designers, photographers, and founders — one room, no pitch decks.',
      now() + interval '4 days',
      now() + interval '4 days' + interval '3 hours',
      'The Hofheimer',
      '2818 W Broad St',
      'Richmond',
      ARRAY['networking']::text[],
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'
    ),
    (
      '757 Beat Night',
      'seed-757-beat-night',
      'Open mic + featured artists from the 757.',
      now() + interval '6 days',
      now() + interval '6 days' + interval '4 hours',
      'Chrysler Hall Lobby',
      '215 E Brambleton Ave',
      'Norfolk',
      ARRAY['concert', 'party']::text[],
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80'
    ),
    (
      'DMV Tech & Culture Brunch',
      'seed-dmv-tech-culture-brunch',
      'Small plates, big conversations — APIs to zines.',
      now() + interval '9 days',
      now() + interval '9 days' + interval '3 hours',
      'Union Market NE (partner room)',
      '1309 5th St NE',
      'Washington',
      ARRAY['networking', 'social']::text[],
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&q=80'
    ),
    (
      'Screenprinting Workshop: 1-Color Posters',
      'seed-screenprinting-workshop-1color',
      'Bring a sketch; leave with pulls on French paper.',
      now() + interval '11 days',
      now() + interval '11 days' + interval '4 hours',
      'Studio Two',
      '321 W 21st St',
      'Norfolk',
      ARRAY['workshop']::text[],
      'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=1200&q=80'
    ),
    (
      'Carytown Vinyl Social',
      'seed-carytown-vinyl-social',
      'Listening room + swap table. BYO record to show.',
      now() + interval '14 days',
      now() + interval '14 days' + interval '3 hours',
      'Plan 9 Music',
      '3017 W Cary St',
      'Richmond',
      ARRAY['social', 'concert']::text[],
      'https://images.unsplash.com/photo-1603048588665-791ca8d617af?w=1200&q=80'
    ),
    (
      'Alexandria Waterfront Run & Jam',
      'seed-alexandria-run-jam',
      '5K casual + live brass on the pier.',
      now() + interval '18 days',
      now() + interval '18 days' + interval '6 hours',
      'Founders Park',
      '351 N Union St',
      'Alexandria',
      ARRAY['social', 'other']::text[],
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80'
    ),
    (
      'VB Beach Bonfire Sessions',
      'seed-vb-beach-bonfire-sessions',
      'Acoustic sets at dusk — city permit secured.',
      now() + interval '21 days',
      now() + interval '21 days' + interval '5 hours',
      '17th Street Park',
      'Atlantic Ave',
      'Virginia Beach',
      ARRAY['concert', 'social']::text[],
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'
    ),
    (
      'Charlottesville Indie Market',
      'seed-cville-indie-market',
      '40 makers, two food halls, one DJ.',
      now() + interval '25 days',
      now() + interval '25 days' + interval '8 hours',
      'IX Art Park',
      '522 2nd St SE',
      'Charlottesville',
      ARRAY['social', 'other']::text[],
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80'
    ),
    (
      'Late Night at the National (DJ set)',
      'seed-national-dj-late-night',
      'Museum after dark — electronic set in the atrium.',
      now() + interval '28 days',
      now() + interval '28 days' + interval '4 hours',
      'VMFA',
      '200 N Arthur Ashe Blvd',
      'Richmond',
      ARRAY['party', 'concert']::text[],
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80'
    ),
    (
      'Yesterday''s Block Party (past, for timeline)',
      'seed-yesterday-block-party-past',
      'Already wrapped — shows “recent past” rail on /events.',
      now() - interval '2 days',
      now() - interval '2 days' + interval '6 hours',
      'Granby Street Corridor',
      'Granby St',
      'Norfolk',
      ARRAY['party']::text[],
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80'
    )
) AS v (
  title,
  slug,
  description,
  starts_at,
  ends_at,
  venue_name,
  address,
  city,
  categories,
  flyer_url
)
ON CONFLICT (org_id, slug) DO NOTHING;
