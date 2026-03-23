# ViBE -- Architecture Source of Truth

**Last Updated:** February 5, 2026

This document defines the **canonical module ownership** and **wiring laws** for the ViBE events platform. It answers the question: _"Where does this logic live, and who owns it?"_

If two files appear to do the same thing, this document declares the **winner**. The loser must be removed or refactored.

---

## Non-Negotiable System Boundaries

These rules cannot be overridden by any feature, sprint, or shortcut.

### Rule 1: One Supabase Client Per Context

| Context | Canonical File | Function |
|---------|---------------|----------|
| Browser / Client Component | `lib/supabase/client.ts` | `createSupabaseBrowser()` |
| Server Component / Action / Route Handler | `lib/supabase/server.ts` | `createSupabaseServer()` |

**Law:** No other file may create a Supabase client instance. If you need Supabase, import from these two files. Period.

### Rule 2: Mutations Live in Server Actions

| Domain | Canonical File | Actions |
|--------|---------------|---------|
| Waitlist | `app/actions/subscribe.ts` | `subscribeToWaitlist()` |
| Events | `app/actions/events.ts` | `createEvent()`, `updateEvent()`, `submitEventForReview()` |
| Orders/RSVP | `app/actions/orders.ts` | `createOrder()`, `createFreeRSVP()` |
| Tickets | `app/actions/tickets.ts` | `checkInTicket()` |
| Organizations | `app/actions/orgs.ts` | `createOrganization()`, `inviteMember()` |
| Admin | `app/actions/admin.ts` | `publishEvent()`, `approveOrganization()`, `moderateUser()` |

**Law:** Components never write to the database directly. All mutations go through Server Actions. No exceptions.

### Rule 3: RLS Before Shipping

Every table must have Row Level Security enabled **before** any application code reads from or writes to it. The RLS policies are defined in `VIBE_APP_SPECIFICATION.md` Section 6 and enforced via migration scripts.

**Law:** No table goes live without RLS. If you create a new table, you create its RLS policies in the same PR.

### Rule 4: Auth Trigger Owns Profile Creation

The PostgreSQL trigger `handle_new_user()` creates `profiles` rows when users sign up. Application code must never insert into `profiles` directly.

**Law:** If a profile doesn't exist, the trigger failed. Debug the trigger, don't create a workaround.

### Rule 5: Schema is the Source of Truth

If TypeScript types, documentation, or application code disagree with the database schema (as defined in executed migration scripts), the **schema wins**. Update everything else to match.

---

## Canonical Module Map

### Landing Page (Current -- Live)

| Component | File | Owner | Client? |
|-----------|------|-------|---------|
| Page orchestrator | `app/page.tsx` | Homepage | Server |
| Root layout | `app/layout.tsx` | Global | Server |
| Navigation | `components/navbar.tsx` | Global | Client (mobile toggle) |
| Hero | `components/hero-section.tsx` | Homepage | Server |
| 3D Background | `components/three-background.tsx` | Homepage | Client (Three.js) |
| 3D Wrapper | `components/three-background-wrapper.tsx` | Homepage | Client (dynamic import) |
| Marquee | `components/marquee-section.tsx` | Homepage | Server |
| Editorial grid | `components/editorial-grid.tsx` | Homepage | Server |
| Culture section | `components/culture-section.tsx` | Homepage | Server |
| Events preview | `components/events-section.tsx` | Homepage | Server |
| App mockup | `components/app-preview.tsx` | Homepage | Server |
| Waitlist form | `components/waitlist-section.tsx` | Waitlist | Client (form) |
| Footer | `components/footer.tsx` | Global | Server |

### Authentication (Phase 1 -- Planned)

| Module | File | Owner |
|--------|------|-------|
| Login page | `app/login/page.tsx` | Auth |
| Signup page | `app/signup/page.tsx` | Auth |
| Auth callback | `app/api/auth/callback/route.ts` | Auth |
| Route protection | `middleware.ts` | Auth |
| Role helper | `lib/auth-helpers.ts` | Auth |
| Profile trigger | `scripts/004_create_profiles.sql` | Auth / DB |

### Events System (Phase 2 -- Planned)

| Module | File | Owner |
|--------|------|-------|
| Public event feed | `app/events/page.tsx` | Events |
| Event detail | `app/events/[id]/page.tsx` | Events |
| Event CRUD actions | `app/actions/events.ts` | Events |
| Flyer upload | Supabase Storage `event-flyers` bucket | Events |

### Ticketing (Phase 3-4 -- Planned)

| Module | File | Owner |
|--------|------|-------|
| Ticket wallet | `app/tickets/page.tsx` | Tickets |
| Ticket detail | `app/tickets/[id]/page.tsx` | Tickets |
| Order actions | `app/actions/orders.ts` | Tickets |
| Stripe checkout | `app/api/stripe/create-checkout-session/route.ts` | Payments |
| Stripe webhook | `app/api/stripe/webhook/route.ts` | Payments |

### Organizer Dashboard (Phase 5 -- Planned)

| Module | File | Owner |
|--------|------|-------|
| Dashboard | `app/organizer/page.tsx` | Organizer |
| Event management | `app/organizer/events/page.tsx` | Organizer |
| Door check-in | `app/organizer/events/[id]/door/page.tsx` | Organizer |
| Org actions | `app/actions/orgs.ts` | Organizer |

### Admin (Phase 6 -- Planned)

| Module | File | Owner |
|--------|------|-------|
| Admin dashboard | `app/admin/page.tsx` | Admin |
| Event approval | `app/admin/events/page.tsx` | Admin |
| Org approval | `app/admin/orgs/page.tsx` | Admin |
| User moderation | `app/admin/users/page.tsx` | Admin |
| Admin actions | `app/actions/admin.ts` | Admin |

---

## Data Flow Architecture

```
Browser (Client Components)
    │
    ├── Read: Supabase client (lib/supabase/client.ts) via SWR
    │         ↓ RLS enforces row-level access
    │
    └── Write: Server Actions (app/actions/*.ts)
               ↓ Uses server Supabase client (lib/supabase/server.ts)
               ↓ RLS enforces row-level access
               ↓ revalidateTag() busts cache
               ↓ Returns { data, error } result object

Server Components (RSC)
    │
    └── Read: Supabase server (lib/supabase/server.ts) directly
              ↓ RLS enforces row-level access
              ↓ Data passed as props to Client Components

Stripe Webhooks (app/api/stripe/webhook/route.ts)
    │
    └── Write: Supabase Admin Client (service role, bypasses RLS)
               ↓ Only for trusted webhook operations
               ↓ Verifies Stripe signature before processing
```

---

## Shared Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `cn()` | `lib/utils.ts` | Tailwind class merging (clsx + tailwind-merge) |
| `createSupabaseBrowser()` | `lib/supabase/client.ts` | Browser Supabase client |
| `createSupabaseServer()` | `lib/supabase/server.ts` | Server Supabase client |
| `getUserRole()` | `lib/auth-helpers.ts` (planned) | Returns user, isAdmin, orgMemberships |

**Law:** Before adding a new utility, check if one already exists. If it does, use it. If it's close but not quite right, extend it. Never duplicate.

---

## Environment Variables

### Required (Already Configured)

| Variable | Context | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key |

### Required (Future Phases)

| Variable | Context | Purpose | Phase |
|----------|---------|---------|-------|
| `STRIPE_SECRET_KEY` | Server only | Stripe API key | Phase 4 |
| `STRIPE_WEBHOOK_SECRET` | Server only | Webhook signature verification | Phase 4 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe client key | Phase 4 |

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
