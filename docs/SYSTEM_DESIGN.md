# ViZb — System design

**Last updated:** June 28, 2026
**Audience:** Engineers, architects, AI agents, operators

---

## 1. What is this system?

**ViZb** (branded **VIZB** in the UI) is an events discovery and ticketing platform for the Virginia/DMV creative community. It combines:

- **Public discovery** — flyer-first event listings, editorial posts, open-mic lineups
- **Attendance** — free RSVP (minted as $0 tickets), paid Stripe Checkout, door QR check-in
- **Organizer tools** — org-scoped event CRUD, ticket tiers, check-in scanner
- **Staff admin** — event review, community listings, posts CMS, user moderation, trust signals

**Stack:** Next.js 16 App Router monolith + hosted Supabase (Postgres, Auth, Storage) + Vercel runtime. No separate backend service.

---

## 2. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (Node.js)                         │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐ │
│  │ proxy.ts     │  │ Server          │  │ Route handlers     │ │
│  │ session gate │→ │ Components +    │  │ app/api/*          │ │
│  │              │  │ Server Actions  │  │ (webhooks, wallet) │ │
│  └──────────────┘  └────────┬────────┘  └─────────┬──────────┘ │
└─────────────────────────────┼─────────────────────┼────────────┘
                              │                     │
                    anon key + cookies      service role (trusted)
                              ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (hosted)                           │
│   Postgres + RLS │ Auth │ Storage (flyers, posts, covers)       │
└─────────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
    Browser reads                   Stripe webhooks
    (lib/supabase/client.ts)        Resend (advertise only)
```

**Law:** RLS is the ultimate authorization authority. App gates (`requireAdmin`, `requireOrgMember`) and `proxy.ts` session checks are additive, not substitutes.

---

## 3. Core domains

| Domain | Purpose | Primary code | Primary tables |
|--------|---------|--------------|----------------|
| **Identity** | Auth session, profiles | `proxy.ts`, `lib/auth-helpers.ts`, `app/auth/` | `profiles` (trigger bootstrap) |
| **Organizations** | Venues, partners, promoters | `app/actions/organization.ts`, `invite.ts` | `organizations`, `organization_members`, `org_invites` |
| **Events** | Lifecycle, discovery, trust | `app/actions/event.ts`, `event-trust.ts`, `lib/events/` | `events`, `event_media` |
| **Registrations** | RSVP state machine | `app/actions/registrations.ts` | `event_registrations` |
| **Ticketing** | Types, orders, mint, wallet | `ticket-types.ts`, `ticket-checkout.ts`, `lib/tickets/` | `ticket_types`, `orders`, `order_items`, `tickets` |
| **Payments** | Stripe Checkout + fulfillment | `app/api/stripe/webhook/route.ts` | `webhook_logs`, RPC `fulfill_stripe_ticket_order` |
| **Check-in** | Door scanner + manual | `checkin.ts`, `organizer-checkin.ts`, `api/checkin/scan` | `event_registrations.status` |
| **Posts** | Public editorial feed | `admin-posts.ts`, `posts-admin.ts`, `lib/posts/` | `posts` |
| **Lineup** | Open-mic board | `app/actions/lineup.ts` | `event_lineup_entries` |
| **Community listings** | External RSVP events | `event_kind` in `event.ts` | `events.event_kind`, `external_rsvp_url` |
| **My Vibes** | Saved events | `app/actions/vibes.ts` | `event_saves` |
| **Notifications** | In-app bell + saved-event reminders | `app/actions/notifications.ts`, `app/api/cron/event-reminders` | `user_notifications`, `event_saves` |
| **Follows/preferences** | Dashboard personalization | `app/actions/follows.ts`, `member-preferences.ts` | `member_follows`, `member_preferences` |
| **Event ingestion** | Eventbrite/Ticketmaster candidates | `app/actions/event-import.ts`, `candidate-import.ts`, `app/api/cron/*-import`, `lib/imports/**` | `event_import_*` tables |
| **Organizer payouts** | Payout readiness and release | `app/actions/admin-payments.ts`, `organizer-stripe-connect.ts`, `app/api/cron/release-payouts` | `organizer_payouts`, `organizer_stripe_accounts` |
| **Host onboarding** | Apply + admin review | `host-application.ts` | `host_applications` |
| **Marketing** | Waitlist, advertise | `subscribe.ts`, `advertise-contact.ts` | `subscribers` |

---

## 4. Request and data flow

### 4.1 Read path (Server Components)

1. Request hits `proxy.ts` → `lib/supabase/middleware.ts` refreshes session cookies.
2. RSC page loads → `createClient()` from `lib/supabase/server.ts`.
3. Explicit `select` lists query Postgres; RLS filters rows.
4. Data passed as props to Client Components (interactive leaves only).

### 4.2 Write path (Server Actions)

1. Client invokes action in `app/actions/*.ts` (`"use server"`).
2. Action calls `requireAuth` / `requireAdmin` / `requireOrgMember` as needed.
3. Server Supabase client performs insert/update/delete.
4. `revalidatePath` invalidates affected routes.

**Law:** No database writes from Client Components.

### 4.3 Free RSVP → ticket mint

```
Member clicks RSVP
  → registrations.rsvpToEvent()
  → upsert event_registrations (confirmed)
  → RPC mint_free_rsvp_ticket_for_registration
  → orders (completed, $0) + tickets row
  → revalidate /tickets, /events/[slug]
```

### 4.4 Paid checkout

```
Member selects paid tier
  → ticket-checkout.createTicketCheckoutSession()
  → service role inserts orders (pending_payment) + order_items
  → Stripe Checkout Session (metadata: order_id, event_id, ticket_type_id)
  → redirect to Stripe
  → webhook POST /api/stripe/webhook
  → verify signature → webhook_logs idempotency
  → RPC fulfill_stripe_ticket_order
  → registration + ticket mint → order completed
```

**Never trust** client redirect alone; fulfillment is webhook-driven.

### 4.5 Door check-in

```
Organizer scans QR
  → POST /api/checkin/scan { token, eventId }
  → verify HMAC token (TICKET_QR_SECRET)
  → assertCheckInScanAllowed (org member or staff_admin)
  → update event_registrations → checked_in
```

Alternate: manual check-in via `organizer-checkin.ts` / admin `checkin.ts` actions.

### 4.6 Community event (external RSVP)

Staff creates `event_kind = community` under platform org (`PLATFORM_ORG_SLUG`, default `vizb`). Published listing shows external link; no ViZb-hosted RSVP/ticketing for that row.

---

## 5. Auth and permissions model

### Session boundary

| Piece | File | Responsibility |
|-------|------|----------------|
| Proxy entry | `proxy.ts` | Matcher; delegates to `updateSession` |
| Session helper | `lib/supabase/middleware.ts` | Cookie refresh; coarse route protection |
| Auth callback | `app/auth/callback/route.ts` | `exchangeCodeForSession`; safe redirects |

**Protected prefixes** (session required): `/dashboard`, `/organizer`, `/admin`, `/tickets`, `/profile`.

**Public:** `/`, `/events`, `/p`, `/lineup`, `/about`, `/advertise`, `/login`, `/signup`.

**Note:** There is no root `middleware.ts`. Next.js 16 uses `proxy.ts`.

### Role model

| Layer | Mechanism | Values |
|-------|-----------|--------|
| Platform | `profiles.platform_role` | `user`, `staff_admin`, `staff_support` |
| Org | `organization_members.role` | `owner`, `admin`, `editor`, `viewer` |
| Legacy | `profiles.role_admin` | Boolean; hardened, not client-writable; **app gates use `platform_role`** |

| Persona | App gate | RLS helper |
|---------|----------|------------|
| Member | `requireAuth()` | `auth.uid()` |
| Staff admin | `requireAdmin()` → `platform_role = staff_admin` | `is_staff_admin()` |
| Org member | `requireOrgMember(slug)` | `is_org_member()`, membership joins |
| Staff on any org | `requireOrgMember` bypass for `staff_admin` | `is_staff_admin()` |

Profile creation: **database trigger** `handle_new_user()` — app must not insert into `profiles`.

---

## 6. Data model overview

### Event lifecycle

`event_status`: `draft` → `pending_review` → `published` | `rejected` | `cancelled` | `archived`

Staff/org editors create drafts. Submit for review. Staff publishes or rejects. Archived events have special update policies (`024_allow_staff_update_archived`).

### Registration lifecycle

`event_registrations.status`: `confirmed` → `checked_in` | `cancelled`

### Order lifecycle

`orders.status`: `pending_payment` → `completed` | `failed` | `expired` | `cancelled` | `refunded`

### Key `events` columns (accumulated)

- `categories TEXT[]`, `rsvp_capacity`, `flyer_url`
- `event_kind` (`official` | `community`), `external_rsvp_url`
- `is_staff_pick`, `public_detail_view_count`
- Review: `reviewed_by`, `reviewed_at`, `review_notes`

### Schema sources

| Track | Path | Role |
|-------|------|------|
| Bootstrap mirror | `scripts/*.sql` (001–030+) | Full historical schema; SQL Editor apply |
| CLI deltas | `supabase/migrations/*.sql` | Incremental; `supabase db push` |

**Greenfield warning:** CLI migrations alone do not recreate base tables (`profiles`, `organizations`, `events`). Existing projects were bootstrapped via `scripts/` first. See [OPERATIONS.md](./OPERATIONS.md).

---

## 7. Integration boundaries

| Integration | Direction | Trust boundary | Required env |
|-------------|-----------|----------------|--------------|
| Supabase | App ↔ Postgres/Auth/Storage | Anon key + RLS; service role for webhooks/checkout | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | Stripe → webhook; App → Checkout API | Webhook signature verification | `STRIPE_*` |
| Resend | App → email API | Server-only key | `RESEND_*` (advertise leads; auth via Supabase SMTP) |
| Vercel Analytics | Client beacon | Public | auto via `@vercel/analytics` |
| Apple/Google Wallet | App → pass files | User session + wallet certs | `APPLE_WALLET_*`, `GOOGLE_WALLET_*` |
| Sentry | Client + server SDK | Production/main only | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, build: `SENTRY_AUTH_TOKEN` |

### API routes (complete inventory)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/stripe/webhook` | Payment fulfillment |
| POST | `/api/stripe/checkout/[eventId]` | Event ticket Checkout route |
| POST | `/api/checkin/scan` | QR check-in |
| POST | `/api/events/[slug]/view` | View counter beacon |
| GET | `/api/calendar/ics` | ICS export |
| GET | `/api/tickets/pass/apple` | Apple Wallet `.pkpass` |
| GET | `/api/tickets/pass/google` | Google Wallet save JWT |
| GET | `/api/cron/event-reminders` | My Vibes event reminders |
| GET | `/api/cron/eventbrite-import` | Scheduled Eventbrite import |
| GET | `/api/cron/ticketmaster-import` | Scheduled Ticketmaster import |
| GET | `/api/cron/release-payouts` | Organizer payout release job |
| GET | `/api/admin/imports/sources` | Staff import source list |
| GET | `/api/admin/imports/sources/[sourceKey]/health` | Staff import source health |
| POST | `/api/admin/imports/eventbrite/run` | Staff-triggered Eventbrite import |
| POST | `/api/admin/imports/ticketmaster/run` | Staff-triggered Ticketmaster import |

All other mutations: **Server Actions** in `app/actions/`.

### Storage buckets

| Bucket | Public read | Write |
|--------|-------------|-------|
| `event-flyers` | Yes | Org members (path `{org_id}/...`) or staff |
| `post-covers` | Yes | `staff_admin` |
| `posts` | Yes | `staff_admin` (body gallery images) |

---

## 8. Deployment and runtime

- **Host:** Vercel (project: `digital-builders/v0-website-redesign-guidance`)
- **Node:** `>=20`; CI uses 22
- **Branching:** Features → `develop`; release `develop` → `main` (merge commit only)
- **CI:** `npm run ci` + `npm run test:e2e` on PRs (`.github/workflows/pr-ci.yml`)
- **DB:** Hosted Supabase; apply migrations before shipping schema-dependent code
- **Async/background work:** Stripe webhooks, DB triggers, Vercel cron route handlers for reminders/imports/payout release, and trusted staff import triggers.

---

## 9. Key technical decisions

See [DECISIONS.md](./DECISIONS.md) for ADR-style detail. Summary:

1. **Monolith** — no separate API service; Server Actions as mutation layer
2. **RLS-first security** — even admin flows respect policies where possible; service role only for trusted server paths
3. **Unified ticket model** — free RSVP mints `$0` completed order + ticket row (same door flow as paid)
4. **Server Components default** — Client Components only for interactivity (forms, scanner, Three.js)
5. **Dual SQL tracks** — historical `scripts/` + CLI `supabase/migrations/` (CLI-first for deltas)
6. **Platform org** — staff-created official/community events via `PLATFORM_ORG_SLUG`
7. **Webhook idempotency** — `webhook_logs` table + `processed_at`
8. **5% platform fee** — `lib/payments/ticket-fees.ts` on paid checkout

---

## 10. Risks and known constraints

| Risk | Mitigation |
|------|------------|
| Schema drift (code deployed before `db push`) | Release checklist in [OPERATIONS.md](./OPERATIONS.md) |
| Placeholder prod migrations (`20260208*`) | Cannot replay true prod history on greenfield from CLI migrations alone |
| `role_admin` vs `platform_role` doc/code drift | Standardize on `platform_role` in all new docs |
| `subscribers` RLS uses `role_admin` | Staff with only `platform_role` may not read waitlist |
| Sentry env without SDK on Preview | Preview/develop intentionally omit DSNs — do not assume monitoring there |
| `env.local` (no dot) ignored | Must use `.env.local` |
| Missing `supabase/seed.sql` | `db reset` seed step fails if config references it |
| `admin_list_users` RPC not versioned in repo SQL | Confirm remote DB or add a migration before relying on admin user list recovery |
| Stripe webhook runtime confidence | Unit coverage exists, but live Stripe dashboard/webhook smoke remains required before launch sign-off |
| v0.app lineage | UI may originate from v0; architecture truth is in-repo |

---

## 11. Extension points

| Area | How to extend safely |
|------|---------------------|
| New table | New `supabase migration new`; RLS in same PR; update contract |
| New mutation | New or extend `app/actions/*.ts`; never client-side writes |
| New public route | `app/` page; update `role-surfaces` diagram |
| New integration | Route handler or action + env in `.env.example` + [OPERATIONS.md](./OPERATIONS.md) |
| New event category | Migration + `lib/events/categories.ts` |
| Paid features | Stripe metadata contract + webhook handler branch |

---

## Related docs

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) — short orientation
- [ARCHITECTURE_CONSTITUTION.md](./ARCHITECTURE_CONSTITUTION.md) — non-negotiable laws
- [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) — file ownership
- [EVENTS_SOURCE_OF_TRUTH.md](./EVENTS_SOURCE_OF_TRUTH.md) — event domain laws
- [contracts/INDEX.md](./contracts/INDEX.md) — domain contracts
