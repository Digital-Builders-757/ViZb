# Repository map

**Last updated:** June 8, 2026  
**Purpose:** Find code fast. For ownership laws, see [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md).

---

## Top-level layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router — routes, layouts, actions, API |
| `components/` | React UI (presentational; no direct DB writes) |
| `lib/` | Shared server/client utilities, Supabase, domain logic |
| `scripts/` | Numbered SQL bootstrap mirror (`001`–`030+`) |
| `supabase/` | CLI config + timestamped migrations |
| `docs/` | Documentation system |
| `tests/e2e/` | Playwright specs |
| `.cursor/` | Cursor commands and rules (committed) |
| `.github/workflows/` | CI (`pr-ci.yml`, `release-guard.yml`) |
| `public/` | Static assets |

---

## `app/` — routes and server boundary

### Public marketing

| Path | File |
|------|------|
| `/` | `app/page.tsx` |
| `/about` | `app/about/page.tsx` |
| `/advertise` | `app/advertise/page.tsx` |

### Events & discovery

| Path | File |
|------|------|
| `/events` | `app/events/page.tsx` |
| `/events/[slug]` | `app/events/[slug]/page.tsx` |
| `/lineup/[eventSlug]` | `app/lineup/[eventSlug]/page.tsx` |

### Posts feed

| Path | File |
|------|------|
| `/p` | `app/p/page.tsx` |
| `/p/[slug]` | `app/p/[slug]/page.tsx` |

### Auth

| Path | File |
|------|------|
| `/login`, `/signup` | `app/login/page.tsx`, `app/signup/page.tsx` |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` |
| `/auth/callback` | `app/auth/callback/route.ts` |
| `/auth/callback/recovery` | `app/auth/callback/recovery/route.ts` |
| `/auth/error`, `/auth/sign-up-success` | `app/auth/error/page.tsx`, etc. |

### Dashboard group `app/(dashboard)/`

Shared layout: `app/(dashboard)/layout.tsx` — sidebar, notifications bell, org list.

| Surface | Paths |
|---------|-------|
| Member hub | `/dashboard`, `/profile` |
| Tickets | `/tickets`, `/tickets/[ticketId]`, `/dashboard/tickets/...` (aliases) |
| Host apply | `/host/apply` |
| Organizer | `/organizer/new`, `/organizer/[slug]`, `.../events/new`, `.../events/[eventSlug]`, `.../check-in` |
| Staff admin | `/admin`, `/admin/events/*`, `/admin/posts/*`, `/admin/event-listing-reports` |

### Invites

| Path | File |
|------|------|
| `/invite/claim` | `app/invite/claim/page.tsx` |

### API route handlers

| Path | File |
|------|------|
| `POST /api/stripe/webhook` | `app/api/stripe/webhook/route.ts` |
| `POST /api/checkin/scan` | `app/api/checkin/scan/route.ts` |
| `POST /api/events/[slug]/view` | `app/api/events/[slug]/view/route.ts` |
| `GET /api/calendar/ics` | `app/api/calendar/ics/route.ts` |
| `GET /api/tickets/pass/apple` | `app/api/tickets/pass/apple/route.ts` |
| `GET /api/tickets/pass/google` | `app/api/tickets/pass/google/route.ts` |

### Server Actions — `app/actions/`

| File | Domain |
|------|--------|
| `event.ts` | Event CRUD, flyer, review, archive, duplicate |
| `event-trust.ts` | Staff pick, listing reports |
| `registrations.ts` | RSVP, cancel |
| `ticket-types.ts` | Tier CRUD (organizer) |
| `ticket-checkout.ts` | Stripe Checkout session |
| `checkin.ts`, `undo-checkin.ts` | Admin check-in |
| `organizer-checkin.ts`, `organizer-undo-checkin.ts` | Door check-in |
| `organization.ts` | Org create (admin) |
| `invite.ts` | Invites, claim, revoke |
| `host-application.ts` | Host apply + review |
| `admin-users.ts` | Staff user delete (service role) |
| `admin-registrations.ts` | Admin registration list |
| `admin-posts.ts` | Post media uploads |
| `posts-admin.ts` | Post archive/delete |
| `lineup.ts` | Open-mic lineup CRUD |
| `notifications.ts` | Mark read, staff seed |
| `profile.ts` | Display name |
| `vibes.ts` | Save/remove events |
| `subscribe.ts` | Waitlist |
| `advertise-contact.ts` | Partnership form → Resend |

Tests: `app/actions/__tests__/`

---

## `lib/` — shared logic

### Supabase (canonical clients)

| File | Role |
|------|------|
| `lib/supabase/client.ts` | Browser client |
| `lib/supabase/server.ts` | Server client |
| `lib/supabase/service-role.ts` | Trusted server bypass |
| `lib/supabase/middleware.ts` | Session refresh (called from `proxy.ts`) |
| `lib/supabase/project-env.ts` | Env resolution |
| `lib/supabase/storage-errors.ts` | Upload error messages |

### Auth

| File | Role |
|------|------|
| `lib/auth-helpers.ts` | `requireAuth`, `requireAdmin`, `requireOrgMember`, `getProfile` |
| `lib/auth/auth-error-map.ts` | User-facing auth errors |
| `lib/auth/pending-verify-email.ts` | Sign-up pending state |

### Events domain

| Path | Role |
|------|------|
| `lib/events/categories.ts` | Category validation |
| `lib/events/event-kind.ts` | Official vs community |
| `lib/events/discovery-rails.ts` | Starting soon + ViZb picks rails |
| `lib/events/discovery-filters.ts` | Listing filters |
| `lib/events/rsvp-capacity.ts` | Capacity parsing |
| `lib/events/my-vibes-queries.ts` | Saved events |
| `lib/events/flyer-upload-constraints.ts` | Flyer upload limits |

### Ticketing & payments

| Path | Role |
|------|------|
| `lib/tickets/mint-free-rsvp-ticket.ts` | Free RSVP mint wrapper |
| `lib/tickets/barcode-token.ts` | Barcode HMAC |
| `lib/ticket-qr-token.ts` | QR token for scanner |
| `lib/payments/ticket-fees.ts` | 5% platform fee calc |
| `lib/stripe/env.ts`, `lib/stripe/server.ts` | Stripe client |

### Posts, lineup, wallet, calendar

| Path | Role |
|------|------|
| `lib/posts/` | Post queries, upload constraints |
| `lib/lineup/` | Open-mic helpers |
| `lib/wallet/` | Apple/Google pass builders |
| `lib/calendar/build-ics.ts` | ICS generation |
| `lib/notifications/dashboard-queries.ts` | Bell feed |

### Other

| File | Role |
|------|------|
| `lib/utils.ts` | `cn()` Tailwind merge |
| `lib/public-site-url.ts` | Absolute URL origin |
| `lib/orgs/platform-org.ts` | `PLATFORM_ORG_SLUG` |
| `lib/checkin-scan-permissions.ts` | Scanner authorization |

---

## `components/` — UI by area

| Folder | Purpose |
|--------|---------|
| `components/ui/` | shadcn primitives — **do not edit** |
| `components/events/` | RSVP CTA, share, My Vibes, view beacon |
| `components/organizer/` | Event forms, check-in scanner, lineup, ticket tiers |
| `components/admin/` | Review queue, posts editor, user table |
| `components/dashboard/` | Sidebar, calendar, ticket wallet |
| `components/posts/` | Latest posts section |
| `components/auth/` | Sign-up success panel |
| `components/brand/` | Logo, header marks |

Root-level: `navbar.tsx`, `footer.tsx`, `hero-section.tsx`, `three-background*.tsx`, etc.

---

## `scripts/` — SQL bootstrap

Apply in numeric order for greenfield or recovery. Key files:

| Script | Creates / changes |
|--------|-------------------|
| `003_create_enums.sql` | Core enums |
| `004_create_profiles.sql` | `profiles` + `handle_new_user` trigger |
| `005_create_organizations.sql` | Orgs + members |
| `013_create_events.sql` | Events + media |
| `010b_invite_system.sql` | Invites, host applications, `is_staff_admin()` |
| `025_create_event_registrations.sql` | RSVP table |
| `028_tickets_core_free_rsvp.sql` | Ticketing core |
| `030_stripe_checkout_fulfillment.sql` | Stripe RPC (superseded by CLI upgrade) |
| `020_posts_mvp_platform_role.sql` | `posts` + `platform_role` |

Verification: `scripts/verify_019_020_applied.sql`

---

## `supabase/migrations/` — CLI deltas

Timestamped files applied via `supabase db push`. Notable:

- `20260410142142` — ticketing tables
- `20260411120000` — Stripe fulfillment RPC (older name)
- `20260606000500` — Stripe MVP upgrade (`fulfill_stripe_ticket_order`, `webhook_logs`)
- `20260505163945` — `event_kind`, external RSVP
- `20260505184652` — staff pick, listing reports

Placeholder history: `20260208035848`, `20260208035906` (prod SQL unknown).

---

## `docs/` — documentation

| Entry | Purpose |
|-------|---------|
| [README.md](./README.md) | Front door |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Full architecture |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | Short orientation |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | This guide's sibling — how to work |
| [OPERATIONS.md](./OPERATIONS.md) | Deploy and ops |
| [contracts/](./contracts/) | Domain invariants |
| [journeys/](./journeys/) | Acceptance flows |

---

## Root files worth knowing

| File | Purpose |
|------|---------|
| `proxy.ts` | Session proxy (not `middleware.ts`) |
| `package.json` | Scripts and dependencies |
| `.env.example` | Env template |
| `next.config.mjs` | Server Actions 6MB limit, turbopack root |
| `vitest.config.ts` | Unit test config |
| `playwright.config.ts` | E2E config |
| `database_schema_audit.md` | Schema inventory |
| `AGENT_ONBOARDING.md` | Agent quick path |

---

## Where to add new code

| Need | Put it here |
|------|-------------|
| New page | `app/<route>/page.tsx` |
| New mutation | `app/actions/<domain>.ts` (or extend existing) |
| New webhook/API | `app/api/<path>/route.ts` |
| New query helper | `lib/<domain>/` |
| New UI | `components/<domain>/` |
| New table | `supabase migration new` + contract update |
| New doc | Layer 2 contract first, then journey if UX-facing |
