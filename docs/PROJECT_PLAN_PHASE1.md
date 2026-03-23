# ViBE Phase 1: Auth + Dashboard -- Implementation Plan

> **Status:** PHASE 1 COMPLETE -- Security audit passed
> **Last Updated:** February 5, 2026
> **Security Audit:** 8/8 checks passed (see post-build audit below)
> **Depends On:** `BRAND_SYSTEM.md`, `CODING_STANDARDS.md`, `VIBE_APP_SPECIFICATION.md`

---

## Current State (What Exists)

| Layer | What's Done | What's Missing |
|-------|-------------|----------------|
| Database | `subscribers` table (waitlist, scripts 001-002) | Enums, profiles, organizations, all app tables |
| Supabase Client | `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server) | Middleware helper, auth callback, session refresh |
| Auth | Nothing | Login, signup, middleware, route protection, profiles |
| Routes | `/` (landing page only) | `/login`, `/signup`, `/dashboard`, `/organizer/*`, `/admin` |
| Components | Landing page components (navbar, hero, events, editorial grid, etc.) | Auth forms, dashboard layouts, sidebar nav, branded shells |

---

## Architecture Decisions (Locked Before Code)

These decisions are final. Do not revisit during implementation.

### D1: Role Source of Truth

| Role Type | Where It Lives | Who Sets It |
|-----------|---------------|-------------|
| Platform admin | `profiles.role_admin` (boolean) | Direct DB only. Never client-side. |
| Organizer | Derived: user has rows in `organization_members` | Set when user creates/joins an org |
| Attendee | Default. Every authenticated user is an attendee. | Automatic on signup via trigger |

### D2: Authorization Layer Strategy (3-Layer Defense)

| Layer | What It Checks | Fails How |
|-------|---------------|-----------|
| **Middleware** | "Is there a valid session?" Redirects unauthenticated users away from `/dashboard/*`, `/organizer/*`, `/admin/*` to `/login` | 302 redirect |
| **Server layout/page** | Deep checks: "Is this user actually an admin?" / "Is this user an org member?" via `getUser()` + DB query | `redirect()` or `notFound()` |
| **RLS (database)** | Ultimate authority. Even if middleware/layout fail, data is protected. | Empty result set or Postgres error |

Middleware is a **fast bounce** only. It does NOT query the database for roles. Server layouts handle deep authorization.

### D3: Email Confirmation

Email confirmation is **required** for MVP. This means:
- After signup, user sees `/auth/sign-up-success` ("Check your inbox")
- User clicks email link, which hits `/auth/callback` route handler
- Callback confirms session and redirects to `/dashboard`
- The `handle_new_user` trigger creates the profile row (runs with `security definer`, bypasses RLS)

### D4: Post-Signup First-Run

After email confirmation, users land on `/dashboard`. If they have no organization, they see the attendee view with a prominent "Create an Organization" CTA. No separate onboarding route for MVP -- the dashboard IS the onboarding.

---

## Task Breakdown

### Task 0: Auth Config Sanity Check

**Goal:** Verify Supabase project is ready before writing any code.

| Check | Action |
|-------|--------|
| Env vars set | Verify `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist in Vercel Vars |
| Email confirmations | Supabase Auth > Settings: confirmations ON (default) |
| Site URL | Supabase Auth > URL Configuration: set to production URL |
| Redirect URLs | Add `http://localhost:3000/auth/callback` and `https://<prod-domain>/auth/callback` |

**Files changed:** 0 (config only)

---

### Task 1: Database Migrations

**Goal:** Create all Phase 1 tables with RLS. Run in order.

#### File: `scripts/003_create_enums.sql`

```sql
-- All 6 enum types from the spec (Section 5.1)
CREATE TYPE org_type AS ENUM ('venue', 'partner', 'promoter');
CREATE TYPE org_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE org_member_role AS ENUM ('owner', 'manager', 'staff');
CREATE TYPE event_status AS ENUM ('draft', 'pending', 'published', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE media_kind AS ENUM ('flyer', 'gallery');
```

#### File: `scripts/004_create_profiles.sql`

```sql
-- Profiles table (spec Section 5.2)
-- handle_new_user trigger (auto-create profile on signup)
-- RLS: public SELECT, owner UPDATE only
-- No direct INSERT policy (trigger handles it with security definer)
```

#### File: `scripts/005_create_organizations.sql`

```sql
-- organizations table (spec Section 5.2)
-- organization_members table (spec Section 5.2)
-- RLS for both tables (spec Section 6.2, 6.3)
-- Indexes on org_id, user_id
```

**Run order:** 003 > 004 > 005 (each depends on the prior)

---

### Task 2: Auth Infrastructure

**Goal:** Session refresh middleware, route protection, auth callback, role helpers.

#### File: `lib/supabase/middleware.ts` (NEW)

Session refresh helper. Follows the Supabase SSR reference pattern exactly:
- Creates a server client with cookie read/write
- Calls `supabase.auth.getUser()` to refresh the session
- Returns the response with updated cookies

#### File: `middleware.ts` (NEW -- root level)

Route protection:
```
/dashboard/*    --> requires auth (redirect to /login if no session)
/organizer/*    --> requires auth (redirect to /login if no session)
/admin/*        --> requires auth (redirect to /login if no session)
/login          --> if already authed, redirect to /dashboard
/signup         --> if already authed, redirect to /dashboard
```

Middleware does auth-presence checks ONLY. No database queries. No role checks.

Matcher excludes: `_next/static`, `_next/image`, `favicon.ico`, image files, `/`, `/auth/*`.

#### File: `lib/auth-helpers.ts` (NEW)

```typescript
// getUserProfile(supabase) -- returns profile + role_admin + org memberships
// requireAuth(supabase) -- throws redirect if no user
// requireAdmin(supabase) -- throws redirect if not admin
// requireOrgMember(supabase, orgId) -- throws redirect if not a member
// getUserOrganizations(supabase) -- returns orgs the user belongs to
```

All helpers use the server Supabase client. Used in server layouts and pages for deep authorization.

#### File: `app/auth/callback/route.ts` (NEW)

Handles email confirmation and OAuth callbacks:
- Reads `code` from URL search params
- Exchanges code for session via `supabase.auth.exchangeCodeForSession(code)`
- Redirects to `/dashboard` on success, `/auth/error` on failure

---

### Task 3: Auth Pages (ViBE-Branded)

**Goal:** Login, signup, signup success, and error pages. All follow BRAND_SYSTEM.md.

**Brand requirements for ALL auth pages:**
- `bg-background` (void black)
- ViBE logo centered above the form
- `font-serif` for page title ("Sign In", "Join ViBE")
- `font-mono uppercase tracking-widest` for labels
- Sharp corners on all inputs and buttons (radius: 0)
- Primary blue CTA with neon glow on hover
- `text-muted-foreground` for secondary text
- No rounded cards, no light backgrounds, no generic SaaS styling

#### File: `app/login/page.tsx` (NEW)

- Server component with client form
- Fields: email, password
- CTA: "Sign In" (primary blue, uppercase, sharp corners)
- Link to `/signup`
- Error display for invalid credentials
- Uses `supabase.auth.signInWithPassword()`
- On success: redirect to `/dashboard`

#### File: `app/signup/page.tsx` (NEW)

- Fields: display name, email, password
- Passes `display_name` via `options.data` metadata
- Sets `emailRedirectTo` to `/auth/callback`
- On success: redirect to `/auth/sign-up-success`

#### File: `app/auth/sign-up-success/page.tsx` (NEW)

- Static page: "Check your inbox"
- ViBE branded with editorial messaging
- Headline: `font-serif`, subtext explaining the confirmation flow
- Link back to `/login`

#### File: `app/auth/error/page.tsx` (NEW)

- Generic auth error page
- Reads error message from URL search params
- Editorial empty-state pattern from BRAND_SYSTEM.md
- Link back to `/login`

---

### Task 4: Dashboard Shell (Attendee)

**Goal:** Authenticated user's home. Sidebar nav, profile, empty states.

**Brand requirements:**
- Dark sidebar (`bg-card`) with ViBE logo at top
- Active nav item: `border-l-2 border-primary text-primary`
- Inactive nav item: `text-muted-foreground`
- Content area: editorial section headers (mono label above, serif title below)
- Stat cards: `font-mono font-bold text-primary` for numbers
- Empty states: editorial pattern from BRAND_SYSTEM.md

#### File: `app/(dashboard)/layout.tsx` (NEW)

Shared dashboard layout:
- Server component
- Calls `requireAuth()` -- redirects to `/login` if no session
- Fetches user profile + organizations via `getUserProfile()`
- Renders sidebar nav (Dashboard, My Tickets, Profile) + user avatar
- If user has orgs, shows "Organizer" section in sidebar with links to `/organizer`
- If user is admin, shows "Admin" link
- Passes user data via props to children

#### File: `components/dashboard/sidebar.tsx` (NEW)

- ViBE logo at top
- Navigation items with active state detection
- User avatar + display name at bottom
- Sign out button
- Responsive: collapses to sheet on mobile

#### File: `app/(dashboard)/dashboard/page.tsx` (NEW)

Attendee home:
- Welcome message with `font-serif` heading
- Stats row: "Upcoming Events" / "Tickets" / "Communities" (all 0 for now)
- "Your Upcoming Events" section with empty state
- "Create an Organization" CTA card (for users who want to become organizers)

#### File: `app/(dashboard)/profile/page.tsx` (NEW)

- Display name edit form
- Avatar upload (Supabase Storage) -- or placeholder for Phase 2
- Email display (read-only, from auth)
- Server action to update `profiles.display_name`

#### File: `app/actions/auth.ts` (NEW)

Server actions for auth:
- `signOut()` -- signs out and redirects to `/`
- `updateProfile(formData)` -- updates display name in profiles table

---

### Task 5: Organizer Dashboard Shell

**Goal:** Org-scoped dashboard. Only accessible to org members.

#### File: `app/(dashboard)/organizer/layout.tsx` (NEW)

- Server component
- Calls `requireAuth()` + `getUserOrganizations()`
- If user has NO orgs: show "Create Organization" flow
- If user has orgs: render organizer sidebar sub-nav (Overview, Events, Settings)
- Deep authorization: verified at layout level, not just middleware

#### File: `app/(dashboard)/organizer/page.tsx` (NEW)

Org overview:
- Org name + status badge (`font-mono uppercase` bordered badge)
- Stats: "Total Events" / "Tickets Sold" / "Revenue" (0 for now)
- Quick actions: "Create Event" CTA (disabled for now, Phase 2)
- Empty state with editorial messaging

#### File: `app/(dashboard)/organizer/events/page.tsx` (NEW)

Events list (empty state for now):
- Table header with `font-mono uppercase tracking-widest` column labels
- Empty state: "No Events Yet" with neon-gradient headline
- "Create Event" CTA (links to future `/organizer/events/new`)

#### File: `app/(dashboard)/organizer/create/page.tsx` (NEW)

Create organization form:
- Fields: name, slug (auto-generated), type (venue/partner/promoter dropdown), description
- Server action: inserts into `organizations` + creates `organization_members` row with `owner` role
- Redirect to `/organizer` on success

---

### Task 6: Admin Gate + Placeholder

**Goal:** Protect admin routes. Single placeholder page. No feature pages yet.

#### File: `app/(dashboard)/admin/layout.tsx` (NEW)

- Server component
- Calls `requireAuth()` + `requireAdmin()`
- If not admin: redirects to `/dashboard`
- Renders minimal admin layout (reuses dashboard sidebar with admin nav items)

#### File: `app/(dashboard)/admin/page.tsx` (NEW)

Single placeholder:
- `font-serif` heading: "Admin"
- `font-mono` label: "Platform Overview"
- Three placeholder stat cards (Users / Events / Organizations, all 0)
- Editorial empty state: "Full admin tools coming soon."

No `/admin/events`, `/admin/orgs`, `/admin/users` pages yet. Those come when approval workflows exist.

---

## File Map (Complete)

All new files created in Phase 1:

```
scripts/
  003_create_enums.sql                    # Task 1
  004_create_profiles.sql                 # Task 1
  005_create_organizations.sql            # Task 1

lib/
  supabase/
    middleware.ts                          # Task 2 (session refresh)
  auth-helpers.ts                         # Task 2 (role checks)

middleware.ts                             # Task 2 (route protection)

app/
  auth/
    callback/route.ts                     # Task 2 (email confirm handler)
    sign-up-success/page.tsx              # Task 3
    error/page.tsx                        # Task 3
  login/page.tsx                          # Task 3
  signup/page.tsx                         # Task 3
  actions/
    auth.ts                               # Task 4 (signOut, updateProfile)
  (dashboard)/
    layout.tsx                            # Task 4 (shared shell + sidebar)
    dashboard/page.tsx                    # Task 4 (attendee home)
    profile/page.tsx                      # Task 4 (edit profile)
    organizer/
      layout.tsx                          # Task 5 (org-scoped layout)
      page.tsx                            # Task 5 (org overview)
      events/page.tsx                     # Task 5 (events list)
      create/page.tsx                     # Task 5 (create org form)
    admin/
      layout.tsx                          # Task 6 (admin gate)
      page.tsx                            # Task 6 (placeholder)

components/
  dashboard/
    sidebar.tsx                           # Task 4 (branded sidebar nav)
```

**Total new files:** 21
**Files modified:** 0 (existing code untouched)

---

## Execution Order

```
Task 0  Auth config sanity (no code -- verify env vars + Supabase settings)
  |
  v
Task 1  Run migrations (003 > 004 > 005, sequential)
  |
  v
Task 2  Auth infrastructure (middleware + helpers + callback)
  |
  v
Task 3  Auth pages (login + signup + success + error)
  |
  v
Task 4  Dashboard shell + sidebar + profile (depends on Task 2 + 3)
  |
  v
Task 5  Organizer shell + create org (depends on Task 4 layout)
  |
  v
Task 6  Admin gate + placeholder (depends on Task 4 layout)
```

Tasks 3-6 are all UI work that can partially overlap once Task 2 is done, but layouts depend on each other so the order above is safest.

---

## Brand Compliance Checkpoints

After each task is complete, verify:

| Checkpoint | Where to Check |
|------------|---------------|
| No `rounded-lg` on cards, buttons, inputs | All new `.tsx` files |
| No `bg-white`, `text-gray-*`, `border-zinc-*` | All new `.tsx` files |
| Page titles use `font-serif` | Auth pages, dashboard pages |
| Labels/badges use `font-mono uppercase tracking-widest` | Sidebar, stats, tables |
| Primary blue is the only accent color | CTAs, active states, numbers |
| Empty states follow editorial pattern | Dashboard, organizer, admin |
| Dark backgrounds only (`bg-background`, `bg-card`) | Every page |
| Inputs: sharp corners, `focus:ring-primary` | Login, signup, profile, create org |

---

## What Phase 1 Does NOT Include

These are explicitly deferred to preserve momentum:

| Feature | Deferred To | Why |
|---------|-------------|-----|
| Event creation form | Phase 2 | Needs file upload + ticket type builder |
| Ticket purchasing / Stripe | Phase 4 | Needs events to exist first |
| Door check-in | Phase 5 | Needs tickets to exist first |
| Admin approval workflows | Phase 3 | Needs events + orgs to exist first |
| `/admin/events`, `/admin/orgs`, `/admin/users` | Phase 3 | No data to manage yet |
| Avatar upload | Phase 2 | Nice-to-have, not blocking |
| OAuth providers (Google, etc.) | Post-MVP | Email+password is sufficient for launch |

---

## Success Criteria

Phase 1 is done when:

- [ ] A new user can sign up at `/signup`, receive confirmation email, click link, and land on `/dashboard`
- [ ] A returning user can sign in at `/login` and see their dashboard
- [ ] The dashboard sidebar shows correct nav items based on role (attendee vs organizer vs admin)
- [ ] A user can create an organization at `/organizer/create` and see the organizer dashboard
- [ ] An admin user (set via DB) can access `/admin` and sees the placeholder
- [ ] Non-authenticated users are redirected to `/login` when accessing protected routes
- [ ] Non-admin users are redirected to `/dashboard` when accessing `/admin`
- [ ] Every page passes the brand compliance checklist above
- [ ] RLS prevents data leakage: a user cannot see another user's profile edits or org memberships via API

---

## Post-Build Security Audit (8/8 Checks)

Conducted against the 8-point "prove it" checklist:

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Redirect loop audit | PASS | `/login`, `/signup`, `/auth/*`, `/auth/callback`, `/` are all unprotected. Only `/dashboard`, `/organizer`, `/admin`, `/tickets`, `/profile` redirect to login. |
| 2 | Session refresh works | PASS | `updateSession()` follows Supabase reference pattern: creates server client with cookie get/set, calls `getUser()` to refresh token. |
| 3 | RLS is the real gate | PASS (after fix) | **Fixed in 006:** Profiles update policy now blocks `role_admin` self-promotion via `WITH CHECK` that compares against current value. |
| 4 | Admin doesn't use service role | PASS (after fix) | **Fixed in 006:** Added `orgs_select_admin` and `org_members_select_admin` policies so admin can count all orgs/members via normal anon client. No service-role key used. |
| 5 | Org slug collisions | PASS | `createOrganization` checks slug uniqueness and returns clean error message. |
| 6 | Organizer routes require membership | PASS | `requireOrgMember()` checks org exists + user has membership row, redirects to `/dashboard` otherwise. |
| 7 | Login page rendering | PASS | Client component with `useSearchParams` wrapped in Suspense via `loading.tsx`. Form-heavy page correctly uses client-side state. |
| 8 | Column name consistency | PASS (after fix) | **Fixed:** `organization_id` references in actions and auth-helpers corrected to `org_id` to match actual schema. Removed phantom `owner_id` column from org insert. |

### Migration 006: `scripts/006_rls_security_fixes.sql`

Applied 4 RLS patches:
1. `profiles_update_own` -- WITH CHECK now prevents `role_admin` self-promotion
2. `orgs_select_admin` -- Admins can read all orgs regardless of status
3. `org_members_select_admin` -- Admins can read all org members
4. `orgs_update_admin` -- Admins can update orgs (for future approval workflows)
