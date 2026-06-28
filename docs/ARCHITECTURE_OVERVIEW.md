# Architecture overview

**Last updated:** June 28, 2026
**Read time:** ~5 minutes  
**For depth:** [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)

---

## What ViZb is

Events discovery + ticketing for the DMV creative scene. Next.js 16 monolith on Vercel, data and auth on hosted Supabase.

**Shipped surfaces:** public event feed, redesigned home page, RSVP + paid tickets, ticket wallet, door check-in, organizer dashboard, organizer payouts, staff admin, posts feed, local event imports, open-mic lineup, My Vibes reminders, and community event listings.

---

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, Tailwind 4, shadcn/Radix |
| App | Next.js 16 App Router (RSC-first) |
| Data | Supabase Postgres + RLS |
| Auth | Supabase Auth (cookie session via `@supabase/ssr`) |
| Files | Supabase Storage |
| Payments | Stripe Checkout + webhook |
| Deploy | Vercel |

---

## Repository shape

```
app/           Routes, layouts, Server Actions, API handlers
components/    UI (presentational; no DB writes)
lib/           Supabase clients, auth helpers, domain logic
scripts/       SQL bootstrap mirror (001–030+)
supabase/      CLI migrations (timestamped deltas)
docs/          This documentation system
```

---

## Request flow (30-second version)

1. **`proxy.ts`** refreshes Supabase session; redirects unauthenticated users away from `/dashboard`, `/organizer`, `/admin`, `/tickets`, `/profile`.
2. **Server Components** read data via `lib/supabase/server.ts` (RLS applies).
3. **Client Components** call **Server Actions** (`app/actions/`) for mutations.
4. **Route handlers** (`app/api/`) handle webhooks, wallet passes, QR scan, ICS, view beacons.

There is **no** root `middleware.ts` — session logic lives in **`proxy.ts`**.

---

## Supabase clients (only three)

| Client | File | Use |
|--------|------|-----|
| Browser | `lib/supabase/client.ts` | Client Component reads |
| Server | `lib/supabase/server.ts` | RSC, actions, most API routes |
| Service role | `lib/supabase/service-role.ts` | Stripe webhook, checkout order insert, admin user delete |

**Never** instantiate `@supabase/supabase-js` elsewhere.

---

## Roles

| Persona | How recognized | Example routes |
|---------|----------------|----------------|
| Guest | No session | `/`, `/events`, `/p` |
| Member | `requireAuth()` | `/dashboard`, `/tickets` |
| Organizer | `organization_members` row | `/organizer/[slug]/...` |
| Staff admin | `platform_role = staff_admin` | `/admin/...` |

**Admin gate in code:** `requireAdmin()` checks **`platform_role`**, not `role_admin` (legacy column).

**Org roles:** `owner`, `admin`, `editor`, `viewer`.

`staff_support` exists in the enum but has no shipped route/action gate yet.

---

## Core domains → where to look

| Domain | Actions | Routes |
|--------|---------|--------|
| Events | `app/actions/event.ts` | `/events`, `/organizer/.../events/...` |
| RSVP / tickets | `registrations.ts`, `ticket-checkout.ts` | `/events/[slug]`, `/tickets` |
| Check-in | `organizer-checkin.ts`, `api/checkin/scan` | `.../check-in` |
| Posts | `admin-posts.ts`, `posts-admin.ts` | `/p`, `/admin/posts` |
| Admin | `admin-users.ts`, `event-trust.ts` | `/admin` |
| Stripe | `api/stripe/webhook` | (webhook only) |
| Imports | `event-import.ts`, `candidate-import.ts` | `/admin/events/imports`, `/api/cron/*-import` |
| Payouts | `admin-payments.ts`, `organizer-stripe-connect.ts` | `/admin/payments`, `/organizer/[slug]/payments` |

Full map: [REPO_MAP.md](./REPO_MAP.md) and [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md).

---

## Critical flows

### Free RSVP
`rsvpToEvent` → `event_registrations` → mint RPC → `tickets` + `$0` order.

### Paid ticket
`createTicketCheckoutSession` → Stripe → webhook → `fulfill_stripe_ticket_order` RPC.

### Check-in
Scan QR → `POST /api/checkin/scan` → update registration to `checked_in`.

---

## Laws (do not break)

From [ARCHITECTURE_CONSTITUTION.md](./ARCHITECTURE_CONSTITUTION.md):

1. No business logic in `proxy.ts`
2. No DB writes from Client Components
3. Explicit `select` lists (avoid `select('*')` in new code)
4. RLS on every exposed table
5. Profile creation via DB trigger only
6. Schema wins over docs/types

**Red zones** (use `/redzone`): `proxy.ts`, auth callback, RLS policies, Stripe webhook.

---

## Environment minimum

```bash
# .env.local (note leading dot)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional for features: Stripe keys, `SUPABASE_SERVICE_ROLE_KEY`, `TICKET_QR_SECRET`, Resend, wallet certs. Full list: `.env.example` and [OPERATIONS.md](./OPERATIONS.md).

---

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run ci           # typecheck → test → lint → build
npm run test:e2e     # Playwright (also in CI)
```

---

## Read next

| Task | Doc |
|------|-----|
| Local setup | [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) |
| Full design | [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) |
| File locations | [REPO_MAP.md](./REPO_MAP.md) |
| Deploy / migrations | [OPERATIONS.md](./OPERATIONS.md) |
| Feature invariants | [contracts/INDEX.md](./contracts/INDEX.md) |
| User flows | [journeys/INDEX.md](./journeys/INDEX.md) |
