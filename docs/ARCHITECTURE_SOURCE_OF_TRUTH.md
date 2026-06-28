# ViBE — Architecture Source of Truth

**Last Updated:** June 28, 2026

This document defines the **canonical module ownership** and **wiring laws** for the ViBE events platform. It answers the question: _"Where does this logic live, and who owns it?"_

If two files appear to do the same thing, this document declares the **winner**. The loser must be removed or refactored.

---

## Non-Negotiable System Boundaries

These rules cannot be overridden by any feature, sprint, or shortcut.

### Rule 1: One Supabase Client Per Context

| Context | Canonical File | Function |
|---------|---------------|----------|
| Browser / Client Component | `lib/supabase/client.ts` | `createClient()` |
| Server Component / Action / Route Handler | `lib/supabase/server.ts` | `createClient()` |

**Law:** No other file may create a Supabase client instance. If you need Supabase, import from these two files. Period.

### Rule 2: Mutations Live in Server Actions

Domain logic is split across **`app/actions/*.ts`** (one file per area). Representative ownership:

| Domain | Canonical file | Examples |
|--------|----------------|----------|
| Waitlist | `app/actions/subscribe.ts` | `subscribeToWaitlist()` |
| Events (CRUD, flyer, review) | `app/actions/event.ts` | `createEvent()`, `updateEventDetails()`, `submitEventForReview()`, `reviewEvent()`, … |
| RSVP / registrations | `app/actions/registrations.ts` | `rsvpToEvent()`, `cancelRsvp()`, … |
| Ticket types | `app/actions/ticket-types.ts` | `createEventTicketType()`, … |
| Paid checkout | `app/actions/ticket-checkout.ts` | `createTicketCheckoutSession()` |
| Admin payments / payouts | `app/actions/admin-payments.ts`, `organizer-stripe-connect.ts` | Payment admin queries/actions, Connect onboarding |
| Check-in (door) | `app/actions/checkin.ts`, `organizer-checkin.ts`, `undo-checkin.ts`, `organizer-undo-checkin.ts` | Registration check-in / undo |
| Organizations & invites | `app/actions/organization.ts`, `invite.ts` | Org create, invites, claim |
| Profile | `app/actions/profile.ts` | Display name updates |
| Member preferences / follows | `app/actions/member-preferences.ts`, `follows.ts` | Dashboard preferences, followed organizers |
| Open mic lineup | `app/actions/lineup.ts` | Lineup CRUD, ordering, status |
| Event recaps | `app/actions/event-recap.ts` | Attach post-event recap links |
| Event imports | `app/actions/event-import.ts`, `candidate-import.ts` | Source run controls and candidate review |
| Posts (admin — editor media) | `app/actions/admin-posts.ts` | Cover/body image uploads to Storage; remove orphaned objects |
| Posts (admin — moderation) | `app/actions/posts-admin.ts` | Archive / delete posts |
| Admin utilities | `app/actions/admin-users.ts`, `admin-registrations.ts` | Staff-only operations |
| Host applications | `app/actions/host-application.ts` | Submit / review applications |
| Notifications | `app/actions/notifications.ts` | Mark read, staff seed |
| Observability | `app/actions/sentry-diagnostics.ts` | Staff-only Sentry diagnostics |
| Advertising leads | `app/actions/advertise-contact.ts` | Contact form submit |
| My Vibes | `app/actions/vibes.ts` | Save / remove saved events |

**Law:** Components never write to the database directly. All mutations go through Server Actions (or trusted server route handlers such as Stripe webhooks). No exceptions.

### Rule 3: RLS Before Shipping

Every table must have Row Level Security enabled **before** any application code reads from or writes to it. RLS policies are defined in `VIBE_APP_SPECIFICATION.md` Section 6 and enforced via migration scripts.

**Law:** No table goes live without RLS. If you create a new table, you create its RLS policies in the same PR.

### Rule 4: Auth Trigger Owns Profile Creation

The PostgreSQL trigger `handle_new_user()` creates `profiles` rows when users sign up. Application code must never insert into `profiles` directly.

**Law:** If a profile doesn't exist, the trigger failed. Debug the trigger, don't create a workaround.

### Rule 5: Schema is the Source of Truth

If TypeScript types, documentation, or application code disagree with the database schema (as defined in executed migration scripts), the **schema wins**. Update everything else to match.

---

## Request boundary (session refresh)

| Piece | File | Role |
|-------|------|------|
| Next.js 16 proxy entry | `proxy.ts` | Matcher + calls `updateSession` |
| Session helper | `lib/supabase/middleware.ts` | Cookie refresh, protected-route redirects |

**Law:** No business rules in the proxy layer — session refresh and auth gates only. See `docs/ARCHITECTURE_CONSTITUTION.md`.

---

## Canonical Module Map

### Home page and public shell (live)

| Component | File | Owner | Client? |
|-----------|------|-------|---------|
| Page orchestrator | `app/page.tsx` | Homepage | Server |
| Root layout | `app/layout.tsx` | Global | Server |
| Navigation | `components/navbar.tsx` | Global | Client (mobile toggle) |
| Redesign hero | `components/home/home-redesign-hero.tsx` | Homepage | Server |
| Homepage event rail/grid | `components/home/home-events-grid.tsx` | Homepage/events | Server |
| Homepage experience flow | `components/home/home-experience-flow.tsx` | Homepage | Server |
| Homepage event data | `lib/events/homepage-events.ts` | Events | Server utility |
| Shared app shell | `components/ui/app-shell.tsx` | Global UI | Server |
| Ocean divider | `components/ui/ocean-divider.tsx` | Global UI | Server |
| App mockup | `components/app-preview.tsx` | Homepage | Server |
| Waitlist form | `components/waitlist-section.tsx` | Waitlist | Client (form) |
| Footer | `components/footer.tsx` | Global | Server |

Legacy marketing components such as `components/hero-section.tsx`, `three-background*.tsx`, `marquee-section.tsx`, `editorial-grid.tsx`, and `culture-section.tsx` may still be used by `/about`, archived redesign docs, or future experiments. They are no longer the canonical `/` composition unless `app/page.tsx` imports them again.

### Authentication (live)

| Module | File | Owner |
|--------|------|-------|
| Login | `app/login/page.tsx` | Auth |
| Signup | `app/signup/page.tsx` | Auth |
| Forgot password | `app/auth/forgot-password/page.tsx` | Auth |
| Auth callback | `app/auth/callback/route.ts` | Auth |
| Session + route gate | `proxy.ts`, `lib/supabase/middleware.ts` | Auth |
| Server auth helpers | `lib/auth-helpers.ts` | Auth (`requireAuth`, `getProfile`, `requireAdmin`, `requireOrgMember`, …) |
| Profile trigger (DB) | `scripts/004_create_profiles.sql` (reference; migrations apply on project) | Auth / DB |

### Events & discovery (live)

| Module | File | Owner |
|--------|------|-------|
| Public listing | `app/events/page.tsx` | Events |
| Public detail | `app/events/[slug]/page.tsx` | Events |
| Event actions | `app/actions/event.ts` | Events |
| Flyer storage | Supabase Storage (`event-flyers` bucket) | Events |
| Event imports | `app/actions/event-import.ts`, `candidate-import.ts`; `lib/imports/**`, `lib/eventbrite/**`, `lib/ticketmaster/**` | Event ingestion |
| Import admin routes | `app/(dashboard)/admin/events/imports/**` | Staff admin |

### Posts & lineup (live)

| Module | File | Owner |
|--------|------|-------|
| Post feed / detail | `app/p/page.tsx`, `app/p/[slug]/page.tsx` | Community |
| Public lineup board | `app/lineup/[eventSlug]/page.tsx` | Lineup |
| Lineup actions | `app/actions/lineup.ts` | Lineup |
| Admin posts | `app/(dashboard)/admin/posts/**` | Staff admin |

### Ticketing & RSVP (live)

| Module | File | Owner |
|--------|------|-------|
| Member tickets | `app/(dashboard)/dashboard/tickets/**`, `app/(dashboard)/tickets/**` | Tickets |
| RSVP / cancel | `app/actions/registrations.ts` | Tickets |
| Ticket types | `app/actions/ticket-types.ts` | Organizer |
| Stripe checkout session | `app/actions/ticket-checkout.ts`, `app/api/stripe/checkout/[eventId]/route.ts` | Payments |
| Stripe webhook | `app/api/stripe/webhook/route.ts` | Payments |
| Admin payment ops | `app/actions/admin-payments.ts`, `app/(dashboard)/admin/payments/**` | Staff admin / payments |
| Organizer Connect and payouts | `app/actions/organizer-stripe-connect.ts`, `app/(dashboard)/organizer/[slug]/payments/page.tsx`, `app/api/cron/release-payouts/route.ts` | Payments |
| Wallet / QR helpers | `lib/tickets/**` | Tickets |

### Organizer (live)

| Module | File | Owner |
|--------|------|-------|
| Org home | `app/(dashboard)/organizer/[slug]/page.tsx` | Organizer |
| Event editor | `app/(dashboard)/organizer/[slug]/events/[eventSlug]/page.tsx` | Organizer |
| New event | `app/(dashboard)/organizer/[slug]/events/new/page.tsx` | Organizer |
| Door check-in | `app/(dashboard)/organizer/[slug]/events/[eventSlug]/check-in/page.tsx` | Organizer |
| Org / invite actions | `app/actions/organization.ts`, `invite.ts` | Organizer |
| Event recaps and insights | `app/actions/event-recap.ts`, `lib/organizer/event-insights.ts` | Organizer |

### Admin (live)

| Module | File | Owner |
|--------|------|-------|
| Admin home | `app/(dashboard)/admin/page.tsx` | Staff admin |
| Event review surface | `app/(dashboard)/admin/events/[id]/page.tsx` | Staff admin |
| User admin actions | `app/actions/admin-users.ts` | Staff admin |
| Import queue/review | `app/(dashboard)/admin/events/imports/**`, `app/actions/candidate-import.ts` | Staff admin |
| Sentry diagnostics | `app/(dashboard)/admin/diagnostics/sentry/page.tsx`, `app/actions/sentry-diagnostics.ts` | Staff admin / observability |

---

## Data Flow Architecture

```
Browser (Client Components)
    │
    ├── Read: Supabase `createClient()` from lib/supabase/client.ts
    │         ↓ RLS enforces row-level access
    │
    └── Write: Server Actions (app/actions/*.ts)
               ↓ Uses server `createClient()` from lib/supabase/server.ts
               ↓ RLS enforces row-level access
               ↓ revalidatePath / tags as implemented per action
               ↓ Returns { data, error } or throws per local conventions

Server Components (RSC)
    │
    └── Read: Supabase server `createClient()` directly
              ↓ RLS enforces row-level access
              ↓ Data passed as props to Client Components

Stripe Webhooks (app/api/stripe/webhook/route.ts)
    │
    └── Write: service-role or trusted server paths only
               ↓ Verify Stripe signature before processing
```

---

## Shared Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `cn()` | `lib/utils.ts` | Tailwind class merging (clsx + tailwind-merge) |
| `createClient()` (browser) | `lib/supabase/client.ts` | Browser Supabase client |
| `createClient()` (server) | `lib/supabase/server.ts` | Server Supabase client |
| `requireAuth`, `getProfile`, `requireAdmin`, … | `lib/auth-helpers.ts` | Server-only auth + profile gates |

**Law:** Before adding a new utility, check if one already exists. If it does, use it. If it's close but not quite right, extend it. Never duplicate.

---

## Environment Variables

**Canonical list:** root `.env.example` (keep docs aligned when adding vars).

| Variable | Context | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Server | Optional duplicates for server-only code paths |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin API (e.g. staff user delete); never expose to client |
| `NEXT_PUBLIC_SITE_URL` | Public | Absolute URLs (Stripe, ICS, share links) |
| Stripe, Resend, Sentry, wallet pass secrets | Server / public per `.env.example` | Integrations — see example file |

---

## Drift Prevention

### Signs of Drift

- Two files that both query the same table for the same purpose
- A Server Action and an API route that do the same mutation
- A client-side Supabase call that should be a Server Action
- A `profiles` INSERT that isn't the auth trigger
- Types that don't match the database schema
- RLS policies that don't match what's in `VIBE_APP_SPECIFICATION.md`

### When You Find Drift

1. Identify the canonical winner using this document
2. Update the loser to use the winner (or delete the loser)
3. Document the fix in your PR description
4. If this document is missing the mapping, add it
