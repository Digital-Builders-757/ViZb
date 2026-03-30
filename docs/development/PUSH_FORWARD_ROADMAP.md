# ViBE / ViZb — Push-forward roadmap

**Last updated:** March 23, 2026  
**Purpose:** Single checklist to move the product forward after recent engineering hardening. Deep spec remains in **`docs/MVP_STATUS_ROADMAP.md`** and **`docs/VIBE_APP_SPECIFICATION.md`** — refresh those when phase gates change.

---

## 1. What we have already done (recent engineering)

Use this as context so you do not redo work.

| Area | Outcome |
|------|--------|
| **Local dev** | `npm run dev` documented; **`npm run ci`** is the quality gate (typecheck → test → lint → build). |
| **Env files** | Next.js only loads **`.env.local`** (leading dot). Misnamed **`env.local`** was the root cause of missing `NEXT_PUBLIC_*` in the browser. |
| **Supabase — middleware** | If URL/key are missing in **development**, middleware skips session refresh so marketing pages still load; **production** still requires keys. |
| **Supabase — browser** | `lib/supabase/client.ts` trims vars, clear errors, **`isBrowserSupabaseConfigured()`**; **Navbar** skips creating a client when unset. |
| **Supabase — server** | `lib/supabase/project-env.ts`: server and middleware resolve **`NEXT_PUBLIC_*` first**, then fall back to **`SUPABASE_URL` / `SUPABASE_ANON_KEY`** (matches `.env.example`). |
| **Public events UI** | `/events` and `/events/[slug]` avoid crashing in **dev** when Supabase is not configured; **production** still fails fast if misconfigured. |
| **Advertising / partnerships** | **`/advertise`** — structured “Advertise with ViZb” inquiry form; emails **`admin@thevavibe.com`** by default via **Resend** (`RESEND_API_KEY`, optional `ADMIN_EMAIL`, `RESEND_FROM`). |

**Operational habits:** merge work on **`develop`**; use **`/ship`** when a batch is ready; visible UI changes → **`docs/BRAND_CONSTITUTION.md`** + **`/brand-check`**.

---

## 2. Where the product actually is (reality check)

The **February 2026** snapshot inside **`docs/MVP_STATUS_ROADMAP.md`** is **behind the repo**. For example:

- **`scripts/`** includes events- and review-related SQL through **`018_*`** (e.g. **`013_create_events.sql`**, flyers bucket, staff policies, review metadata).
- The app includes **public events** routes and **dashboard/admin/organizer** surfaces that assume an **`events`** (and related) schema in Supabase.

**Action for you:** Treat **`database_schema_audit.md`** + your live Supabase project as truth. Re-audit the roadmap doc when you confirm which scripts are applied in each environment.

---

## 3. Roadmap — follow in order

### Track A — Make local + staging boring (1–3 days)

1. **One env file** — Keep secrets only in **`.env.local`**. Ensure both pairs match the same project when you use them:
   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required for browser)
   - `SUPABASE_URL` + `SUPABASE_ANON_KEY` (optional duplicate for server; same values)
2. **Restart after env changes** — `npm run dev` does not always pick up new vars until restart.
3. **Remove footguns** — Optional: delete stray **`C:\Users\young\package-lock.json`** if it is not a real project (avoids Next “multiple lockfiles” warnings).
4. **CI green** — Run **`npm run ci`** before every PR to `develop`.

### Track B — Schema and RLS truth (ongoing)

1. **Inventory** — List which **`scripts/*.sql`** are applied on **dev** vs **prod** Supabase.
2. **Migrations discipline** — For new DB changes, prefer **`supabase migration new …`** + tracked files under **`supabase/migrations/`** (per your team rule); keep **`scripts/`** legacy or migrate history intentionally.
3. **RLS regression** — After any policy change, run the checklist in **`docs/MVP_STATUS_ROADMAP.md`** (Security / Post-Migration Regression).

### Track C — Product: MVP phases (from spec; reorder only if priorities change)

Aligned with **`docs/MVP_STATUS_ROADMAP.md`** / **`docs/VIBE_APP_SPECIFICATION.md`**:

| Priority | Focus | Done when |
|----------|--------|-----------|
| **C1** | **Events lifecycle** | Published feed, organizer create/edit, flyer storage, admin/staff review if that is in schema — all consistent with RLS. |
| **C2** | **Ticketing v1** | Free RSVP (and data model for ticket types / attendance) as per spec Phase 3. |
| **C3** | **Paid flow** | Stripe Checkout + webhooks, idempotent order handling (Phase 4). |
| **C4** | **Door / check-in** | Staff or organizer check-in UX (Phase 5). |
| **C5** | **Admin + polish** | Approval queues, metrics, mobile dashboard debt, loading states (Phase 6). |
| **C6** | **Monetization surface** | **`/advertise`** live; Resend verified **from** domain in production; optional CRM / lead logging later. |

**Architecture debt called out in roadmap:** move **profile** mutations to **Server Actions** if anything still writes from the client (see “Known Deviations” in **`docs/MVP_STATUS_ROADMAP.md`**).

### Track D — Platform hygiene (when convenient)

1. **`baseline-browser-mapping`** — Update devDependency if build warns (optional).
2. **Next 16** — Plan migration from **`middleware`** to the new **“proxy”** convention when you upgrade.
3. **`eslint-config-next`** vs **`next`** version alignment — Pin or bump so lint matches the framework version.
4. **Docs sync** — Update **`docs/MVP_STATUS_ROADMAP.md`** “Last Audited” + phase tables once you confirm DB and features in production.

---

## 4. Suggested next command (this week)

1. Run **`npm run ci`**.
2. In Supabase, confirm **`events`** (and related) tables + RLS match what **`app/events/*`** and organizer/admin routes expect.
3. Pick **one** vertical slice for **`/plan`**: e.g. “Organizer publishes first real event end-to-end” or “RSVP MVP” — then **`/implement`** / **`/verify`** / **`/ship`** on **`develop`**.

---

## 5. Single source map

| Question | Go to |
|----------|--------|
| Full MVP detail | `docs/MVP_STATUS_ROADMAP.md` |
| Engineering rules | `docs/ARCHITECTURE_CONSTITUTION.md` |
| Cursor commands | `docs/development/ENGINEERING_COMMANDS.md` |
| Brand | `docs/BRAND_CONSTITUTION.md`, `docs/BRAND_SYSTEM.md` |
| Schema audit | `database_schema_audit.md` |

This file is a **navigation + priority** layer only; keep the long-form docs authoritative for contracts and security.
