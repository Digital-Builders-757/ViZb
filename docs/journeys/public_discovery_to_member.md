# Journey: public discovery → member dashboard

**Status:** MVP

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
- `/events/[slug]` — public event detail; free RSVP/paid ticket actions require sign-in when needed
- `/p/[slug]` — public post detail (markdown)
- `/login`, `/signup`

### Member (login required)

- `/dashboard` — member home (month calendar with per-day detail panel + trending + culture picks + tickets)
- **`/tickets`** — member ticket wallet ( **`/dashboard/tickets`** re-exports the same list)
- `/profile`

### Admin (staff only)

- `/admin` — staff admin overview
- `/admin/posts/*` — create/edit posts
- `/admin` tools for events review/management (existing)

---

## Flow: guest lands → discovers → converts

1) **Guest lands on `/`**
   - Sees same neon/glass visual language as the dashboard (Starfield + glass cards)
   - Primary CTA: explore events (scroll or route)
   - Secondary CTA: join/signup

2) **Guest explores `/events`**
   - Timeline cards (poster-first) show location/time/tags
   - Category filter chips narrow feed

3) **Guest opens `/events/[slug]`**
   - Views flyer, time/location blocks
   - Sees RSVP/ticket CTA for official events or external RSVP for community listings
   - If not logged in and CTA requires account: prompt to login/signup with return path

4) **Guest reads content `/p/[slug]`**
   - Posts reinforce brand voice, culture, and momentum
   - Content supports conversion (but is not the entire product)

5) **Guest signs up**
   - After signup/login, redirects to `/dashboard`

---

## Flow: member returns → operates

1) **Member lands on `/dashboard`**
   - Calendar + upcoming
   - Culture picks deep-link into `/events?category=...`
   - Ticket state shown on **`/tickets`** (home quick links use the canonical path)

2) **RSVP / ticket purchase**
   - Free RSVP mints a `$0` ticket
   - Paid checkout redirects through Stripe and fulfills by webhook
   - Orders/RSVP contract governs behavior (see `docs/contracts/rsvps.md`)

---

## Consistency rules (avoid "two apps")

- Shared tokens: `--neon-*` variables
- Shared primitives: `GlassCard`, `NeonButton`, chips/tags
- Shared shell behavior: top bar height, safe-area, spacing rhythm
- Public pages must not re-introduce generic "marketing" typography/spacing that diverges from the dashboard.
- `/events` is intentionally public and outside dashboard chrome even when a signed-in user reaches it from the sidebar.

---

## Operational notes

- Posts are Supabase-native for MVP.
  - Contract: `docs/contracts/community_posts.md`

- Upgrade path:
  - Add richer embeds only if editorial workflow demands it.
  - Introduce a headless CMS only when staff editing constraints justify another system.
