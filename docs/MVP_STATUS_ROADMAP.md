# ViBE Events Platform -- MVP Status & Development Roadmap

> **What is ViBE?**
>
> An events discovery and ticketing platform targeting the Virginia/DMV creative community. Attendees browse events and buy tickets, organizers create events and check in guests at the door, and admins moderate the platform. Think Eventbrite with a streetwear editorial aesthetic.

---

## Current Status: Phase 1 Complete -- Auth + Dashboard Shell

| Field | Value |
|-------|-------|
| **Last Audited** | April 18, 2026 |
| **Audited Environment** | production + develop branch (GitHub) |
| **Migrations Applied** | Verify per environment — canonical apply order: `docs/database/MIGRATIONS.md` (includes registrations, RSVP cap, tickets core, ticket-type editor) |
| **Overall MVP Progress** | Phase 1 complete; Phase 2 largely shipped; Posts MVP shipped; Phase 3 (free RSVP + $0 tickets) largely shipped |
| **Security Audit** | 8/8 checks passed; see Security section + Known Issues |
| **Open Redirect Protection** | PASS -- `auth/callback` validates redirect targets against allowlist |
| **Subscribers Privacy** | PASS -- public SELECT disabled (migration 009); insert-only for waitlist |

> **"Passing" means:** Every migration executes cleanly, all RLS policies are verified, route protection has no redirect loops, and the auth callback rejects open-redirect payloads. Audit complete; controls verified; remaining work captured in roadmap + tech debt sections below.

### Migration Map (Quick Reference)

| Number | Script | Purpose |
|--------|--------|---------|
| 001 | `001_create_subscribers_table.sql` | Waitlist subscribers |
| 002 | `002_add_phone_number.sql` | Phone column on subscribers |
| 003 | `003_create_enums.sql` | 6 enum types |
| 004 | `004_create_profiles.sql` | Profiles + auto-create trigger |
| 005 | `005_create_organizations.sql` | Orgs + org members |
| 006 | `006_rls_security_fixes.sql` | RLS hardening (admin policies) |
| 007 | `007_column_privileges_hardening.sql` | Column-level privilege lock on `role_admin` |
| 008 | `008_fix_enum_values.sql` | Enum alignment (status + org_type values) |
| 009 | `009_fix_subscribers_rls.sql` | Subscribers privacy (admin-only read) |
| 010 | `010a_add_enum_values.sql` / `010b_invite_system.sql` / `010c_cleanup_old_policies.sql` | Platform role + org member roles + invite system |
| 011 | `011_invite_hardening.sql` | Invite/RLS hardening |
| 012 | `012_fix_org_members_recursion.sql` | RLS recursion fix |
| 013 | `013_create_events.sql` | Events + event_media + base RLS |
| 014 | `014_create_event_flyers_bucket.sql` | Storage bucket for event flyers |
| 015 | `015_fix_editor_update_policy.sql` | Editor policy fixes |
| 016 | `016_add_staff_events_update_policy.sql` | Staff/admin events update policy |
| 017 | `017_event_review_metadata.sql` | Review metadata fields |
| 018 | `018_guard_review_fields_trigger.sql` | Trigger guardrails for review fields |
| 019 | `019_staff_event_create_and_flyer_storage.sql` | Staff create + flyer storage behavior |
| 020 | `020_event_categories_array.sql` / `020_posts_mvp_platform_role.sql` | Categories array + Posts MVP (platform_role) |
| 021 | `021_seed_design_events.sql` | Seed data |
| 022 | `022_add_event_archived.sql` | Archived status for events (soft-delete) |
| 023 | `023_lock_archived_events.sql` | Lock archived events read-only for org members |
| 024 | `024_allow_staff_update_archived.sql` | Staff may update archived events (moderation / restore) |
| 025 | `025_create_event_registrations.sql` | `event_registrations` + RSVP policies |
| 026 | `026_event_rsvp_capacity.sql` / `20260410120000_event_rsvp_capacity.sql` | Optional `events.rsvp_capacity` + occupancy RPC |
| 028 | `028_tickets_core_free_rsvp.sql` / `20260410142142_tickets_core_free_rsvp.sql` | `ticket_types`, `orders`, `order_items`, `tickets`, mint RPC |
| 029 | `029_ticket_types_org_crud_and_mint_tier.sql` / `20260410144936_ticket_types_org_crud_and_mint_tier.sql` | Tier capacity / sale window; org CRUD; mint accepts tier id |
| — | `20260417202850_add_open_mic_event_category.sql` | Extends `events_categories_check` for tag **`open_mic`** |
| — | `20260417210000_event_lineup_entries.sql` | **`event_lineup_entries`** + **`lineup_entry_status`** + RLS (public read slice + org/staff CRUD) |
| … | Other timestamped `supabase/migrations/*` | Full order + mirrors: `docs/database/MIGRATIONS.md` |

---

## Phase Completion Summary

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| Phase 1 | Auth + Dashboard Shell | COMPLETE | 100% |
| Phase 2 | Events + Media (Public Feed) | IN PROGRESS (mostly shipped) | 75% |
| Phase 3 | Ticket Types + Free RSVP | IN PROGRESS (free path + wallet + RSVP→ticket hardening + **`open_mic`** category; paid tiers next) | ~68% |
| Phase 4 | Paid Tickets (Stripe Checkout) | IN PROGRESS (checkout + webhook mint shipped; needs env + DB `030`) | ~45% |
| Phase 5 | Door Check-In | NOT STARTED | 0% |
| Phase 6 | Admin Workflows + Polish | IN PROGRESS (~50% — site-wide **neon / glass** UI in `feat/visual-overhaul-neon-glass`; **ship polish:** organizer/admin/event forms migrated off legacy `form-card` / `input-premium` to `GlassCard` + `vibe-input-glass` / `vibe-cta-gradient`; see `docs/VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md`) | ~52% |

### P0 / maintenance (no product phase change)

- **April 18, 2026 — Code hygiene & documentation pass:** Layer 1 docs aligned with **Next.js 16 `proxy.ts`**, real **`app/actions/*`**, and **`createClient()`** naming; master log: **`docs/VIZB_CODE_HYGIENE_AND_DOCUMENTATION_MASTER_PLAN.md`** (includes validation checklist). Product behavior unchanged.
- **April 20, 2026 — Neon/glass UI batch (Phase 6 polish):** Public, auth, organizer, admin, and events/posts surfaces aligned with **`docs/VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md`**; integrated on **`develop`** via `feat/visual-overhaul-neon-glass`. `npm run ci` green before merge. **Also on this line:** admin **post cover** image upload (**`post-covers`** bucket, `supabase/migrations/20260420180000_post_covers_storage.sql`); organizer org home **Attendees** KPI counts **active RSVPs** (`event_registrations`, excl. cancelled) across the org’s events; marketing **home** navbar stays visible (no auto-hide on `/`); **events** timeline cards drop listing blurb (full copy remains on `/events/[slug]`).

### P0 / maintenance (no product phase change)

- **April 18, 2026 — Code hygiene & documentation pass:** Layer 1 docs aligned with **Next.js 16 `proxy.ts`**, real **`app/actions/*`**, and **`createClient()`** naming; master log: **`docs/VIZB_CODE_HYGIENE_AND_DOCUMENTATION_MASTER_PLAN.md`** (includes validation checklist). Product behavior unchanged.

---

## What Exists Today (Verified Against Codebase)

### Landing Page (Pre-Phase 1 -- Live)

- Full marketing homepage at `/` with hero, marquee, editorial grid, events preview, app mockup, waitlist form, footer
- **Ocean impression packs** (see `docs/IMPRESSION_PACKS.md`): Pack 01 ships **ocean section dividers** (`OceanDivider` + tokens in `app/globals.css`). Pack 02 adds optional **`GlassCard` `interactive`** mode (subtle tilt + specular glare, reduced-motion safe) on **event timeline** cards (`/events`) and **latest post** cards on the homepage. Pack 03 adds **`.vibe-focus-ring`** (keyboard-only branded outline + shared glow tokens for `.vibe-input-glass`) on **NeonButton**, **NeonLink**, login/signup, waitlist, **events** filter chips, and **`/advertise`** form controls.
- Global first-load screen (`app/loading.tsx`) uses CSS-only **WaterLoader**; hero, editorial grid, and events preview images use **WaterFrame** (liquid neon edge + inset hover glow; tokens `--water-a` / `--water-b` in `app/globals.css`)
- 3D Three.js animated background (client-side); homepage uses **`AppShell` + neon dashboard backdrop** for parity with `/advertise` and signed-in shells (marketing polish)
- Waitlist subscription via `subscribers` table (scripts 001-002)
- ViBE brand system fully implemented: dark mode, zero radius, Space Grotesk + Playfair Display + JetBrains Mono typography
- Responsive navbar with mobile toggle
- **Partnerships:** **`/advertise`** — “Advertise with ViZb” lead form; public **single-column** page uses the same **`AppShell` + neon backdrop** language as the dashboard (`GlassCard` form, **`WaterFrame`** hero, **`neon-gradient-text`** H1) without the signed-in sidebar. Submissions email **`admin@thevavibe.com`** by default via **Resend** (see **`.env.example`**: `RESEND_API_KEY`, `ADMIN_EMAIL`, `RESEND_FROM`)

### Database (9 Migrations Executed)

| Script | Contents | Status |
|--------|----------|--------|
| `001_create_subscribers_table.sql` | Waitlist `subscribers` table | Executed |
| `002_add_phone_number.sql` | Phone column on subscribers | Executed |
| `003_create_enums.sql` | 6 enum types: `org_type`, `org_status`, `org_member_role`, `event_status`, `order_status`, `media_kind` | Executed |
| `004_create_profiles.sql` | `profiles` table + `handle_new_user` trigger + RLS | Executed |
| `005_create_organizations.sql` | `organizations` + `organization_members` tables + RLS | Executed |
| `006_rls_security_fixes.sql` | 4 RLS patches (admin self-promotion block, admin read policies) | Executed |
| `007_column_privileges_hardening.sql` | Column-level UPDATE privileges on profiles (blocks `role_admin` writes at Postgres level) | Executed |
| `008_fix_enum_values.sql` | Adds missing enum values: `pending_review` to org/event status, `collective`/`brand`/`nonprofit`/`independent` to org_type, `rejected` to event_status | Executed |
| `009_fix_subscribers_rls.sql` | Locks down subscribers table: replaces public SELECT with admin-only read | Executed |

**Tables that exist (now):** `subscribers`, `profiles`, `organizations`, `organization_members`, `events`, `event_media`, `posts`, `event_registrations`, `ticket_types`, `orders`, `order_items`, `tickets` (plus saves/notifications per your env — confirm with `docs/database/MIGRATIONS.md`)

**Still outstanding for Phase 4+:** Stripe Tax / partial refunds automation; Connect payouts; dedicated door UI polish (Phase 5)

**Shipped (Phase 4 slice — April 2026):** `createTicketCheckoutSession` (`app/actions/ticket-checkout.ts`), `POST /api/stripe/webhook` (returns **500/503** on fulfillment / config failure so Stripe retries; **200** only on success or benign skips), `fulfill_stripe_checkout_for_ticket` RPC (`20260411120000_stripe_checkout_fulfillment.sql` / `scripts/030_stripe_checkout_fulfillment.sql`), paid tier pricing in organizer panel, public **Buy ticket** on `/events/[slug]`. **P0 next:** staging/prod checkout smoke test + watch Stripe webhook deliveries after deploy.

**DB hygiene (April 2026):** Migration `20260410120500_enable_pgcrypto.sql` ensures `pgcrypto`; ticket SQL uses `extensions.gen_random_bytes(8)` so `supabase db push` works when `search_path` omits `extensions`. Out-of-order remote history: `supabase db push --include-all`.

### Authentication System (Phase 1 -- Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Email + password sign-up | `app/signup/page.tsx` | DONE -- passes display_name via metadata, sends confirmation email |
| Email + password sign-in | `app/login/page.tsx` | DONE -- client form with error handling, redirect support |
| Email confirmation callback | `app/auth/callback/route.ts` | DONE -- exchanges code for session, redirects to dashboard |
| Sign-up success page | `app/auth/sign-up-success/page.tsx` | DONE -- "Check your inbox" branded page |
| Auth error page | `app/auth/error/page.tsx` | DONE -- generic error with link back to login |
| Session refresh middleware | `lib/supabase/middleware.ts` | DONE -- follows Supabase SSR reference pattern |
| Route protection | `proxy.ts` | DONE -- protects `/dashboard`, `/organizer`, `/admin`, `/tickets`, `/profile`; redirects logged-in users away from `/login` and `/signup` |
| Auth helpers | `lib/auth-helpers.ts` | DONE -- `requireAuth()`, `getProfile()`, `requireAdmin()`, `requireOrgMember()`, `getUserOrganizations()` |
| Profile auto-creation | `scripts/004_create_profiles.sql` trigger | DONE -- `handle_new_user()` creates profile row on signup |
| Sign out | `components/dashboard/sidebar.tsx` | DONE -- client-side sign out with redirect |

### Dashboard Shell (Phase 1 -- Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Dashboard layout | `app/(dashboard)/layout.tsx` | DONE -- server component fetches profile + orgs, renders sidebar |
| Sidebar navigation | `components/dashboard/sidebar.tsx` | DONE -- personal links, org links (dynamic), admin link (conditional) |
| Attendee home page | `app/(dashboard)/dashboard/page.tsx` | DONE -- welcome, stats (0s), first-run prompt, create org CTA, tickets empty state |
| Member planner calendar | `components/dashboard/calendar/*` | Month / Week / Agenda + Eastern dates; day + event selection; detail panel (desktop) / Sheet (mobile); ICS via `app/api/calendar/ics`; org “Hosted by”; query still `getPublishedEventsForDashboardMonth` (widened window). Re-export: `dashboard-month-calendar.tsx` → shell. |
| My Tickets / wallet | `app/(dashboard)/dashboard/tickets/page.tsx`, `app/(dashboard)/tickets/*` (canonical **`/tickets`**), `components/dashboard/tickets/*` | DONE (v1) -- tickets from `tickets` + registration embed; **`/dashboard/tickets`** remains an alias. Calendar actions, **Add to Apple Wallet / Add to Google Wallet** when env is configured (see `docs/operations/WALLET_PASSES_SETUP.md`). APIs: `GET /api/tickets/pass/apple`, `GET /api/tickets/pass/google`. |
| Profile page | `app/(dashboard)/profile/page.tsx` | DONE -- display name edit form with server-side save |
| Profile form component | `components/dashboard/profile-form.tsx` | DONE -- client form with success/error states |

### Organizer System (Phase 1 -- Shell Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Create organization form | `app/(dashboard)/organizer/new/page.tsx` | DONE -- name, auto-slug, type dropdown, description |
| Create organization action | `app/actions/organization.ts` | DONE -- validates inputs, checks slug uniqueness, inserts org + owner membership |
| Org dashboard (per-org) | `app/(dashboard)/organizer/[slug]/page.tsx` | DONE -- pending review notice, stats (0s), events empty state, create event CTA |
| Org membership check | `lib/auth-helpers.ts` `requireOrgMember()` | DONE -- verifies org exists + user is member, redirects otherwise |

### Admin System (Phase 1 -- Placeholder Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Admin gate | `lib/auth-helpers.ts` `requireAdmin()` | DONE -- checks `role_admin`, redirects non-admins to `/dashboard` |
| Admin overview page | `app/(dashboard)/admin/page.tsx` | DONE -- live counts (users, orgs, pending orgs), placeholder approval queue |
| Delete users (staff) | `app/actions/admin-users.ts`, `components/admin/users-table.tsx`, `lib/supabase/service-role.ts`, migration `20260410200000_auth_user_delete_foreign_keys.sql` | DONE -- `auth.admin.deleteUser` with server-only `SUPABASE_SERVICE_ROLE_KEY`; cannot delete self or `staff_admin`; migration relaxes FKs so `auth.users` deletion succeeds |

### Known Deviations from Architecture Laws

| Deviation | Law Violated | Risk Level | Mitigation |
|-----------|-------------|------------|------------|
| Profile form (`profile-form.tsx`) writes directly via client Supabase instead of server action | Rule 2: mutations in server actions | Low | RLS + column-level privileges prevent escalation; only `display_name`, `avatar_url`, `updated_at` are writable. Fix planned for Phase 1.1 polish. |

### Security (Phase 1 -- Hardened)

| Check | Status | Details |
|-------|--------|---------|
| RLS on all tables | PASS | profiles, organizations, organization_members, subscribers all have RLS enabled with policies |
| Admin self-promotion blocked | PASS | `WITH CHECK` on profiles update prevents changing `role_admin` + column-level REVOKE (migration 007) |
| Admin read access | PASS | Admins can read all orgs and members via dedicated policies |
| Admin org updates | PASS | Admins can update orgs for future approval workflows |
| Column name consistency | PASS | All code uses `org_id` (not `organization_id`) matching actual schema |
| No service-role key in client | PASS | Admin page uses normal anon client, relies on RLS |
| Session refresh | PASS | Middleware calls `getUser()` on every request per Supabase SSR pattern |
| No redirect loops | PASS | Public routes excluded from protection, auth pages redirect logged-in users |
| Open redirect protection | PASS | `auth/callback` validates redirect param: relative paths only, allowlisted prefixes, blocks `//` and encoded schemes |
| Subscribers privacy | PASS | Public SELECT disabled (migration 009); only admins can read waitlist emails; public can only insert |
| Enum value consistency | PASS | All enum values match between DB and app code (migration 008 added missing values) |

#### Verification Steps for Critical Fixes

Each critical fix should be verified with these concrete steps. Run after any migration batch.

| Fix | How to Verify | Expected Result | Evidence |
|-----|--------------|-----------------|----------|
| Role escalation hard-lock (007) | Authenticated user calls `supabase.from('profiles').update({ role_admin: true }).eq('id', uid)` | Postgres error: permission denied for column `role_admin` | Network tab shows 403 / error response with `permission denied` |
| Admin read policies (006) | Admin user calls `supabase.from('organizations').select('*').eq('status', 'pending_review')` | Returns all pending orgs. Same query from non-admin returns empty. | Compare response arrays: admin gets rows, non-admin gets `[]` |
| Open redirect protection | Navigate to `/auth/callback?code=valid&redirect=https://evil.com` | Redirects to `/dashboard`, not to external URL | Browser URL bar shows `/dashboard`; no external navigation |
| Open redirect protocol-relative | Navigate to `/auth/callback?code=valid&redirect=//evil.com` | Redirects to `/dashboard`, not to external URL | Browser URL bar shows `/dashboard`; no external navigation |
| Subscribers privacy (009) | Unauthenticated call to `supabase.from('subscribers').select('*')` | Returns empty array (RLS blocks read) | Response body: `{ "data": [], "error": null }` |
| Enum consistency (008) | `INSERT INTO organizations (name, slug, type) VALUES ('Test', 'test', 'collective')` | Succeeds (previously would fail with invalid enum value) | Row appears in `organizations` table; clean up test row after |
| Enum consistency (008) | `INSERT INTO organizations (name, slug, status) VALUES ('Test', 'test2', 'pending_review')` | Succeeds (previously would fail with invalid enum value) | Row appears in `organizations` table; clean up test row after |

#### Post-Migration Regression Checklist

Run this checklist after applying any batch of migrations to confirm no regressions.

**Environment:**
- **Where to run:** v0 preview URL (dev) or `localhost:3000` if running locally
- **Test accounts needed:**
  - Normal user: any fresh signup (e.g., `testuser@example.com`)
  - Admin user: a user whose `profiles.role_admin` has been set to `true` via SQL (`UPDATE profiles SET role_admin = true WHERE id = '<uid>'`)
- **Browser:** Desktop Chrome (mobile dashboard is a known limitation until Phase 6)

**Steps:**

- [ ] **Sign up** -- Create new account with email + password. Confirmation email sends. Profile row auto-created via trigger.
- [ ] **Email confirm + redirect** -- Click confirmation link. Lands on `/dashboard` (not `/login`, not external URL).
- [ ] **Login** -- Sign in with confirmed credentials. Session persists across hard refresh.
- [ ] **Profile edit** -- Change display name on `/profile`. Save succeeds. `role_admin` field NOT writable (verify via dev tools network tab).
- [ ] **Create org** -- Submit org creation form. Org appears in sidebar. Slug collision returns clean error on retry with same name.
- [ ] **Org dashboard** -- Navigate to `/organizer/[slug]`. Shows pending review notice. Non-member redirected to `/dashboard`.
- [ ] **Admin page** -- Admin user sees real counts at `/admin`. Non-admin user redirected to `/dashboard`.
- [ ] **Sidebar nav** -- All sidebar links resolve correctly. Org list updates after org creation. Admin link only visible to admins.
- [ ] **Sign out** -- Click sign out. Redirected to `/`. Protected routes redirect back to `/login`.

**Expected known failures (not regressions):**
- Mobile dashboard navigation does not work (sidebar is desktop-only, fixed `w-64`). This is tracked in tech debt for Phase 6.
- No loading skeletons -- pages may flash while server components load. Tracked for Phase 6.
- Wallet pass issuance requires operator setup (Apple Pass Type ID + Google issuer); without env, dashboard explains that passes are not enabled (no teaser copy).

> **Note:** This manual checklist still covers full product flows. **GitHub PR CI** (`.github/workflows/pr-ci.yml`) runs Vitest, lint, build, and **Playwright** auth UX tests (`tests/e2e/auth-errors.spec.ts`, mocked Supabase). Keep running this checklist after migration batches either way.

### Documentation (Layer 1 Complete; Layers 2-3 Pending)

| Document | Purpose | Status |
|----------|---------|--------|
| `VIBE_APP_SPECIFICATION.md` | Full MVP tech spec (schema, auth, payments, routes, roadmap) | DONE -- 1135 lines |
| `BRAND_SYSTEM.md` | Canonical visual identity with anti-patterns | DONE |
| `ARCHITECTURE_SOURCE_OF_TRUTH.md` | Module ownership, wiring laws, drift prevention | DONE |
| `CODING_STANDARDS.md` | Code style, patterns, conventions | DONE |
| `DOCUMENTATION_INDEX.md` | 3-layer documentation spine | DONE |
| `DEVELOPER_ONBOARDING.md` | Quick-start guide for developers/AI agents | DONE |
| `PROJECT_PLAN_PHASE1.md` | Phase 1 implementation plan with security audit results | DONE |

---

## What does not exist yet (snapshot)

> **Note:** The tables below used to mirror an older file plan (`010_create_events.sql`, `011_create_tickets.sql`). The repo now ships **`013_create_events.sql`** + later numbered scripts and timestamped **`supabase/migrations/*`**. Treat **`docs/database/MIGRATIONS.md`** + **`database_schema_audit.md`** as the apply checklist.

### Database gaps (Phase 4+)

| Gap | Phase | Notes |
|-----|-------|--------|
| Stripe Tax / amount_total vs list price | 4 | Fulfillment RPC expects **no tax** (or match `amount_total` to tier); adjust when enabling Stripe Tax |
| Organizer **paid** tier editor | 4 | **Shipped:** USD price on create/update; price locked after first issued ticket |

### Features not yet built (selected)

| Feature | Route / area | Phase |
|---------|----------------|-------|
| Stripe Checkout + webhook | `app/actions/ticket-checkout.ts`, `/api/stripe/webhook` | 4 — **partially shipped** |
| Dedicated door / scanner screen | `/organizer/.../door` (planned path) | 5 |
| Live Realtime check-in counters | organizer UI | 5 |
| Admin org approval queue polish | `/admin/orgs` | 6 |
| Platform metrics dashboard (enhanced) | `/admin` | 6 |
| Mobile-first sidebar parity | `components/dashboard/sidebar.tsx` | 6 |

### Integrations not yet configured

| Integration | Purpose | Phase |
|-------------|---------|-------|
| Stripe | Paid ticket purchases | 4 |
| Supabase Realtime (optional) | Live check-in counters | 5 |

---

## Implementation Roadmap (Phases 2-6)

### Phase 2: Events + Media (Public Feed)

**Goal:** Organizers can create events with flyers. The public can browse published events.

**Database work:**
- [ ] Write `scripts/010_create_events.sql` -- `events` table, `event_media` table, indexes, RLS policies
- [ ] Create Supabase Storage bucket: `event-flyers` (with MIME/size policies)
- [ ] Add storage policies for bucket access control

**Server actions:**
- [ ] `app/actions/events.ts` -- `createEvent()`, `updateEvent()`, `submitEventForReview()`
- [ ] `app/actions/admin.ts` -- `publishEvent()`, `rejectEvent()`

**Pages:**
- [ ] `/events` -- public event feed with flyer-first grid, filterable by city/date/category
- [ ] `/events/[id]` -- event detail page with flyer hero, description, ticket info, RSVP/buy buttons
- [ ] `/organizer/[slug]/events/new` -- event creation form with flyer upload, date/time picker, location fields
- [ ] `/organizer/[slug]/events/[id]` -- event edit page
- [ ] `/admin/events` -- event approval queue (pending events list with approve/reject actions)

**Components:**
- [ ] `components/events/event-card.tsx` -- flyer-first card for the event grid
- [ ] `components/events/event-form.tsx` -- shared form for create/edit
- [ ] `components/events/flyer-upload.tsx` -- image upload to Supabase Storage
- [ ] `components/events/event-filters.tsx` -- city, date, category filter bar

**Key decisions:**
- Events start as `draft`, organizer submits for review (`pending_review`), admin publishes (`published`) or rejects (`rejected`)
- **Any org can create events** regardless of org status. The gate is on the *event*, not the org. Admin publishes events, not orgs. (Org approval is Phase 6 polish.)
- Flyer is required -- events are flyer-first
- Location is text-based (no map integration for MVP)
- Categories: party, workshop, networking, social (enum)

**Storage policy spec:**

| Setting | Value |
|---------|-------|
| Buckets created | `event-flyers` (defer `event-gallery`, `avatars`, `org-logos` to later phases) |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Max file size | 5 MB |
| Access model | Flyers are **public read** after event publish; signed URLs during `draft`/`pending_review` |
| Who can upload/replace | Org members (owner, manager, staff) for their own org's events |
| Who can delete | Org owners + admins |

**Acceptance criteria:**
- [ ] An organizer with *any* org can create an event with a flyer and submit it for review
- [ ] An admin can see `pending_review` events and publish or reject them
- [ ] Published events appear in the public feed at `/events`
- [ ] Events are filterable by city and category
- [ ] Event detail page shows flyer, description, date/time, location
- [ ] Flyer upload enforces MIME type and size limits

---

### Phase 3: Ticket Types + Free RSVP

**Goal:** Events have ticket tiers. Attendees can RSVP to free events and receive tickets.

**Shipped (April 2026 — Open mic lineup v1):**

- [x] **`event_lineup_entries`** + RLS — `supabase/migrations/20260417210000_event_lineup_entries.sql`; dashboard **`OpenMicLineupPanel`** (`components/organizer/open-mic-lineup-panel.tsx`) on organizer + admin event pages when **`open_mic`** is in categories; public **`/lineup/[eventSlug]`** (`app/lineup/[eventSlug]/page.tsx`) with strict query filters; mutations **`app/actions/lineup.ts`**
- [x] **Public lineup share URL** — `lib/public-site-url.ts` (absolute link from **`NEXT_PUBLIC_SITE_URL`**); organizer panel shows the URL + **Copy public link**; **`docs/OPEN_MIC_LINEUP.md`** + **`.env.example`** document canonical host (e.g. `www` after apex redirect)
- [x] **Organizer lineup visibility UX (April 2026)** — `OpenMicLineupPanel` explains public rules (public + confirmed/performed), per-row public state, empty-eligible callout, draft-event note, open/copy public URL; **`lib/lineup/lineup-entry-status.ts`** helpers mirror public filters; quick-add defaults to **confirmed** in **`app/actions/lineup.ts`**
- [x] **Public lineup page visuals** — **`/lineup/[eventSlug]`** uses the same immersive stack as **`/events`** (`ThreeBackgroundWrapper`, overlay, neon orbs), **`OceanDivider`** rhythm, **`headline-xl`** hero, **`GlassCard` emphasis** + **`WaterFrame`** performer block, **`NeonLink`** CTAs; **`max-w-[1200px]`** layout

**Shipped (April 2026 — Tickets / wallet passes v2):**

- [x] HMAC-signed barcode payload (no PII) — `lib/tickets/barcode-token.ts`
- [x] Apple Wallet `.pkpass` route (Node + `passkit-generator`) — `app/api/tickets/pass/apple/route.ts`
- [x] Google Wallet “save” redirect + `format=json` — `app/api/tickets/pass/google/route.ts`
- [x] Dashboard wallet buttons — `components/dashboard/tickets/ticket-wallet-actions.tsx`
- [x] **Attendee UX (April 2026)** — RSVP + paid checkout land in **My Tickets**: success dialog (`components/events/ticket-added-success-dialog.tsx`) with calendar actions; `rsvpToEvent` returns minted `ticketId`; Stripe return shares the same dialog; wallet list / member home copy clarifies destination and constraints; wallet cards use honest check-in QR + wallet-pass unavailable messaging
- [x] Operator doc — `docs/operations/WALLET_PASSES_SETUP.md`
- [x] **Optional RSVP capacity** — `events.rsvp_capacity`, DB trigger + `published_event_rsvp_occupied_count` RPC (`supabase/migrations/20260410120000_event_rsvp_capacity.sql`, `scripts/026_event_rsvp_capacity.sql`); organizer create/edit forms; public `/events/[slug]` CTA shows fill level and blocks RSVP when full; unlimited vs capped UX on create/edit; org **editors** can update event details (same as create permission); **admin** event detail page reuses the organizer details editor for urgent fixes
- [x] **Organizer event edit — save scopes (April 2026)** — Event details before RSVP/ticket tiers; **Save event details** is the primary CTA (sticky bar, high-contrast, full-width on mobile, unsaved hint when dirty); **Save tier** / **Add tier** stay visually secondary; sonner **Event details saved**; microcopy for whole-event cap vs tiers; `EventDetailsEditForm` remount via `updated_at` on organizer + admin pages. If category saves fail with **`events_categories_check`**, confirm migration **`20260417202850`** on the Supabase project matching app env (`docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`).
- [x] **Free RSVP → \$0 ticket model** — `ticket_types` (default RSVP tier per event), `orders`, `order_items`, `tickets` + `mint_free_rsvp_ticket_for_registration` (`supabase/migrations/20260410142142_tickets_core_free_rsvp.sql`, `scripts/028_tickets_core_free_rsvp.sql`); RSVP action mints ticket after `event_registrations` upsert; dashboard **`/dashboard/tickets`** lists tickets (upcoming / past); **`/dashboard/tickets/[ticketId]`** full ticket view with code; door QR still uses registration id (`rid`) for compatibility

**P0 next:** Harden paid flow (Stripe Tax, refund hooks, monitoring) + revenue reporting. **P1:** *(shipped)* Canonical wallet **`/tickets`**; *(shipped)* Stripe Checkout + webhook mint + paid tier editor (requires env + migration **`030`**).

**Shipped (ticket tiers v1):** Organizer **Free RSVP tiers** UI on organizer event page; optional per-tier capacity + sale window; public event page tier **chooser** when multiple free tiers are on sale; mint RPC accepts optional tier id.

**Database work:**
- [x] `ticket_types`, `orders`, `order_items`, `tickets` + RLS + mint RPC — `028_tickets_core_free_rsvp.sql` / migration `20260410142142_tickets_core_free_rsvp.sql`

**Server actions:**
- [x] Mint after RSVP — `mint_free_rsvp_ticket_for_registration` invoked from `app/actions/registrations.ts` (replaces separate `createFreeRSVP` action for v1)

**Pages:**
- [x] **`/events/[slug]`** — free tier selector when multiple $0 tiers on sale; single tier shows label
- [x] **`/tickets`** and **`/tickets/[ticketId]`** — canonical wallet paths (shared implementation with dashboard alias)
- [x] **`/dashboard/tickets`** — same list/detail as **`/tickets`** (deep links and bookmarks still work)
- [x] Organizer event page — **ticket type panel** (free tiers: name, sort, capacity, sale window; seed default `RSVP` row when none)

**Components (as implemented in repo):**
- [x] Wallet list card — `components/dashboard/tickets/ticket-wallet-card.tsx`
- [x] Wallet detail — `components/dashboard/tickets/ticket-wallet-detail-view.tsx`
- [x] RSVP + tier UX — `components/events/event-rsvp-cta.tsx` (quantity = 1 for free v1)

**Key decisions:**
- Free RSVPs are `$0` tickets -- one unified model for all door-check scenarios
- `ticket_code` is a unique 16-char hex string (QR payload for v2)
- `checked_in_at` being non-null = attendee was checked in

**Acceptance criteria:**
- [x] An organizer can add **free** ticket types (name, sort, capacity, sale window) to their event
- [x] An organizer can add **paid** ticket types (USD) and attendees can check out with Stripe when env + webhook + DB **`030`** are applied
- [x] An attendee can RSVP to a free event and receive a ticket instantly
- [x] Tickets appear in the attendee's wallet at `/tickets`
- [x] Each ticket shows a unique ticket code
- [x] RSVP / tier capacity is enforced (RSVP fails when whole-event or tier cap is full)

---

### Phase 4: Paid Tickets (Stripe Checkout)

**Goal:** Attendees can purchase paid tickets via Stripe Checkout.

**Integration setup:**
- [x] Stripe env vars documented (`.env.example`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`

**API routes / actions:**
- [x] `app/actions/ticket-checkout.ts` — `createTicketCheckoutSession` (server action creates Checkout Session)
- [x] `app/api/stripe/webhook/route.ts` — `checkout.session.completed` → `fulfill_stripe_checkout_for_ticket` (service role)

**Page enhancements:**
- [x] `/events/[slug]` — paid tier picker + **Buy ticket**; return handling via `EventStripeReturn`
- [ ] Optional dedicated `/checkout/success` page (currently query param + toast)

**Key decisions:**
- Stripe Checkout (hosted page) -- no custom payment forms
- Orders start as `pending`, webhook confirms `paid`
- Never trust client redirect as confirmation -- only webhook is authoritative
- All sales run through ViBE's own Stripe account for MVP (manual payouts to organizers)

**Acceptance criteria:**
- [ ] An attendee can select a paid ticket type and complete checkout via Stripe
- [ ] After payment, the webhook mints tickets and updates order status
- [ ] Tickets appear in the attendee's wallet after purchase
- [ ] Failed/cancelled payments do not create tickets
- [ ] Webhook signature verification is enforced

---

### Phase 5: Door Check-In

**Goal:** Organizers can check in attendees at the door on event day.

**Pages:**
- [ ] `/organizer/[slug]/events/[id]/door` -- door check-in screen with attendee list and check-in toggle

**Components:**
- [ ] `components/organizer/door-screen.tsx` -- attendee list with search, check-in button per ticket
- [ ] `components/organizer/checkin-counter.tsx` -- live count of checked-in vs. total

**Server actions:**
- [ ] `app/actions/tickets.ts` -- `checkInTicket()` (sets `checked_in_at` timestamp)

**Optional (nice-to-have):**
- [ ] Supabase Realtime subscription for live check-in counter updates
- [ ] Ticket search by name or ticket code

**Key decisions:**
- Manual tap check-in (no QR scanning for MVP)
- Check-in sets `checked_in_at = now()` -- idempotent (tapping twice is a no-op)
- Requires active internet connection

**Acceptance criteria:**
- [ ] An organizer can open the door screen for their event
- [ ] The attendee list shows all ticket holders with check-in status
- [ ] Tapping "Check In" marks the ticket and updates the counter
- [ ] Only org members can access the door screen (RLS + auth helper)

---

### Phase 6: Admin Workflows + Polish

**Goal:** Full admin dashboard, organization approval queue, user moderation, platform metrics. Responsive polish.

**Pages:**
- [ ] `/admin/orgs` -- organization approval queue (pending list, approve/reject with notes)
- [ ] `/admin/users` -- user management table (search, view profiles, moderate) *(partial: delete non-staff users from **All Users** on `/admin`)* 
- [ ] Enhance `/admin` -- real metrics dashboard (total users, events, tickets sold, revenue)
- [ ] `/admin/events` -- enhanced event management (beyond just approval)

**Server actions:**
- [ ] `app/actions/admin.ts` -- `approveOrganization()`, `suspendOrganization()`, `moderateUser()`

**Polish:**
- [ ] Mobile-responsive sidebar (sheet/drawer on mobile, collapse on tablet)
- [ ] Loading states (skeletons) for all dashboard pages
- [ ] Error boundaries for dashboard pages
- [ ] Toast notifications for all mutations (create event, RSVP, check-in)
- [ ] SEO metadata for public pages (`/events`, `/events/[id]`)
- [ ] Accessibility audit (ARIA labels, focus management, keyboard navigation)

**Acceptance criteria:**
- [ ] An admin can approve or reject pending organizations with notes
- [ ] An admin can view and search all platform users
- [ ] The admin dashboard shows real metrics from live data
- [ ] All dashboard pages work on mobile screens
- [ ] All interactive elements have loading and error states

---

## Feature-Level Completion Matrix

| Feature Category | What Exists | What's Missing | % Done |
|-----------------|-------------|----------------|--------|
| **Landing Page** | Full marketing homepage, waitlist, brand system | Nothing -- complete | 100% |
| **Authentication** | Sign-up, sign-in, email confirmation, session refresh, route protection, sign-out | Google OAuth (post-MVP), magic link (post-MVP) | 95% |
| **User Profiles** | Profile creation trigger, display name edit, read-only email display | Avatar upload, account deletion | 75% |
| **Organizations** | Create org, auto-slug, type selection, membership check, sidebar display | Org settings page, member management, logo upload | 40% |
| **Events** | None | Entire events system (CRUD, feed, detail, media) | 0% |
| **Ticketing** | Free RSVP + paid Stripe Checkout (when configured); wallet **`/tickets`**; wallet passes (env-gated) | Tax, Connect, automated refunds | ~75% |
| **Payments** | Stripe Checkout + webhook mint (USD, migration **`030`**) | Payouts, reporting, dispute automation | ~35% |
| **Door Check-In** | None | Check-in screen, attendee list, live counter | 0% |
| **Admin** | Placeholder with live counts | Approval queues, user moderation, full metrics | 15% |
| **Responsive Design** | Landing page responsive, dashboard desktop-only | Mobile sidebar, responsive dashboard | 50% |
| **Documentation** | Full spec, brand system, architecture, coding standards, onboarding | Domain contracts (Layer 2), user journeys (Layer 3) | 70% |

---

## Technical Debt & Known Issues

| Issue | Severity | Fix Phase | Status | Notes |
|-------|----------|-----------|--------|-------|
| Org type enum mismatch: DB had (venue/partner/promoter) but form uses collective/brand/nonprofit/independent | **High** | Phase 1.1 | **FIXED** (migration 008) | Enum values added; form and DB now match |
| Status vocabulary mismatch: DB had `pending` but code uses `pending_review` | **High** | Phase 1.1 | **FIXED** (migration 008) | `pending_review` added to `org_status` and `event_status` enums |
| Subscribers table allowed public SELECT (email enumeration risk) | Medium | Phase 1.1 | **FIXED** (migration 009) | Replaced with admin-only read policy |
| Profile `role_admin` column writable by authenticated users | Medium | Phase 1.1 | **FIXED** (migration 007) | Column-level REVOKE + selective GRANT on profiles |
| Dashboard sidebar is desktop-only (fixed `w-64`, no mobile collapse) | Medium | Phase 6 | Open | Users on mobile cannot navigate the dashboard |
| Tickets route mismatch | — | Phase 3 | **Resolved** | **`/tickets`** + **`/tickets/[id]`** live; sidebar/nav use canonical paths; `/dashboard/tickets` alias retained |
| Organizer flyer upload **400** in production (Server Action default **1MB** body vs app **5MB** cap) | Medium | Phase 2 | **FIXED** (April 2026) | `next.config.mjs` `experimental.serverActions.bodySizeLimit` (**6mb** transport vs **5MB** file max); shared rules in `lib/events/flyer-upload-constraints.ts` — see `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` |
| No loading.tsx in dashboard routes (except `/login`) | Low | Phase 6 | Open | No skeleton states during server component loading |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` env var in signup page | Low | Phase 2 | Open | Should use origin consistently; dev-only var may cause issues |
| No error boundaries in dashboard routes | Low | Phase 6 | Open | Unhandled errors show generic Next.js error page |
| Profile form uses client-side Supabase write instead of server action | Low | Phase 1.1 | Open | Inconsistent with Rule 2 (mutations in server actions); low risk since RLS + column privileges prevent escalation |

---

## Environment Variables

### Currently Required

| Variable | Set? | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Supabase anonymous key |

### Needed for Future Phases

| Variable | Phase | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Phase 4 | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Phase 4 | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Phase 4 | Stripe client key |

---

## Recommended Execution Order (Next Steps)

### Immediate Priority: Phase 2 (Events + Media)

This is the critical path. Without events, there's nothing to ticket, check in, or monetize. Phase 2 unlocks every subsequent phase.

**Step 1: Database** -- Write and execute `010_create_events.sql` (events + event_media tables with RLS)
**Step 2: Storage** -- Create Supabase Storage buckets for flyers and gallery images
**Step 3: Event CRUD** -- Build event creation form and server actions
**Step 4: Public Feed** -- Build `/events` page with flyer-first grid
**Step 5: Event Detail** -- Build `/events/[id]` with full event info
**Step 6: Admin Approval** -- Build `/admin/events` approval queue

### After Phase 2: Phase 3 (Free RSVP) is the next unlock

Once events exist, free RSVP gives the platform its first real user interaction loop:
1. Organizer creates event
2. Admin publishes event
3. Attendee RSVPs and gets a ticket
4. Organizer sees attendee on check-in list

This loop is the MVP's core value proposition and should be prioritized over paid tickets.

---

## Post-MVP Features (Backlog)

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| QR code scanning for door check-in | High | Medium | Replace manual tap with camera-based scan |
| Stripe Connect for organizer payouts | High | Large | Automated revenue sharing |
| Google OAuth | Medium | Small | One-click signup via Supabase dashboard config |
| Push notifications for event reminders | Medium | Medium | Requires service worker setup |
| Event recommendations / "For You" feed | Low | Large | Needs usage data first |
| Social features (follow organizers, invite friends) | Low | Large | Post-traction feature |
| Event chat / community features | Low | Large | Post-traction feature |
| Light mode support | Low | Medium | Brand system currently dark-mode only |

---

*Last Updated: February 5, 2026 (v4)*
*Current Phase: Phase 1 complete; Phase 2 queued (Events + Media is critical path)*
*Next Review: After Phase 2 completion*

**Revision History:**
- **v1:** Initial draft with phase breakdown and feature matrix
- **v2:** Applied 10-point audit (enum fixes 008, route clarification, storage spec, security hardening 007/009)
- **v3:** Added verification steps for all critical security fixes + post-migration regression checklist
- **v4:** Added migration map, evidence column for verification steps, regression checklist environment/accounts/known-failures. Replaced "no issues found" with honest status language. No critical blockers beyond tracked technical debt.
