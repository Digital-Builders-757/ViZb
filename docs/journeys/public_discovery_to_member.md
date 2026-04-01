# Journey: Public discovery → Member dashboard (Option A: events-first)

**Status:** MVP (in progress)

## Goal

Keep ViZb feeling like **one app** while supporting two modes:
- **Public mode:** anyone can discover events and read ViZb posts (no account)
- **Member mode:** logged-in users get calendar, tickets, personalization, and eventually paid purchase flows

Dashboard is the "main guide" once logged in — but the public surfaces must feel like the same product.

---

## Mode map

### Public (no login required)

- `/` — events-first marketing/discovery + modules
  - Events: trending + culture picks
  - Posts: "From ViZb" (latest published posts)
- `/events` — full public events timeline
- `/events/[slug]` — public event detail (dual CTA shown; actions may be disabled until wired)
- `/p/[slug]` — public post detail (markdown)
- `/login`, `/signup`

### Member (login required)

- `/dashboard` — member home (calendar + trending + culture picks + tickets)
- `/dashboard/tickets` — member tickets
- `/profile`

### Admin (staff only)

- `/admin` — staff admin overview
- `/admin/posts/*` — create/edit posts
- `/admin` tools for events review/management (existing)

---

## Flow: Guest lands → discovers → converts

1) **Guest lands on `/`**
   - Sees same neon/glass visual language as the dashboard (Starfield + glass cards)
   - Primary CTA: explore events (scroll or route)
   - Secondary CTA: join/signup

2) **Guest explores `/events`**
   - Timeline cards (poster-first) show location/time/tags
   - Category filter chips narrow feed

3) **Guest opens `/events/[slug]`**
   - Views flyer, time/location blocks
   - Sees dual CTA (Get Tickets + RSVP)
   - If not logged in and CTA requires account: prompt to login/signup

4) **Guest reads content `/p/[slug]`**
   - Posts reinforce brand voice, culture, and momentum
   - Content supports conversion (but is not the entire product)

5) **Guest signs up**
   - After signup/login, redirects to `/dashboard`

---

## Flow: Member returns → operates

1) **Member lands on `/dashboard`**
   - Calendar + upcoming
   - Culture picks deep-link into `/events?category=...`
   - Ticket state shown in `/dashboard/tickets`

2) **Ticket purchase (future)**
   - Event detail CTA goes live
   - Orders/RSVP contract governs behavior (see `docs/contracts/rsvps.md`)

---

## Consistency rules (avoid "two apps")

- Shared tokens: `--neon-*` variables
- Shared primitives: `GlassCard`, `NeonButton`, chips/tags
- Shared shell behavior: top bar height, safe-area, spacing rhythm
- Public pages must not re-introduce generic "marketing" typography/spacing that diverges from the dashboard.

---

## Operational notes

- Posts are Supabase-native (Markdown) for MVP.
  - Plan/SQL/RLS: `docs/plans/POSTS_MVP.md`
  - Contract: `docs/contracts/community_posts.md`

- Upgrade path:
  - Replace markdown renderer with `react-markdown` + sanitization
  - Add embed support for videos
  - Introduce headless CMS only if the editorial workflow demands it.
