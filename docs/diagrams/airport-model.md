# Airport model — ViBE platform zones

**Last updated:** March 23, 2026

Canonical zone map for planning and triage (`/plan`, `/triage`, `/debug`, `/continue`). Names are **responsibility labels**, not product copy.

**TOTL-shaped alignment:** *Security, Terminals, Manifest, Staff, Ticketing, RLS (Locks), Control Tower* map to the rows below.

---

## Zones

| Zone | Meaning in ViBE | Typical locations |
|------|-----------------|-------------------|
| **Security** | Session refresh, auth gates, redirects | `middleware.ts`, `lib/supabase/middleware.ts` |
| **Terminal** | Interactive UI shells, dashboards, forms | `app/**`, `components/**` (presentation + client islands) |
| **Manifest** | **Public discovery surface** — what unauthenticated/authenticated users browse without editing org data: marketing home, event catalog, event detail | `app/page.tsx`, `app/events/**`, public reads only; content **governed by RLS + publish rules** |
| **Staff** | Business logic, mutations, orchestration | `app/actions/*.ts`, server-only `app/**/route.ts` |
| **Ticketing** | Paid checkout, orders, webhooks *(roadmap)* | Future Stripe routes, `app/api/**` webhooks |
| **Announcements** | Email, SMS, push *(roadmap)* | Future notification modules |
| **Baggage** | Files: flyers, assets | Supabase Storage, upload actions, `scripts/*bucket*` |
| **Locks** | **RLS** — who can read/write which rows; constraints, triggers, enums | `scripts/*.sql`, Supabase policies (see spec §6) |
| **Control Tower** | Admin moderation, approval queues, platform metrics | `app/(dashboard)/admin/**`, admin-oriented actions |

---

## Rules of engagement

1. **Security** stays thin: allow / deny / redirect / refresh session — not domain rules.
2. **Manifest** data is still **protected by Locks (RLS)**; never bypass RLS in the browser for “convenience.”
3. **Staff** owns mutations; **Terminal** calls **Staff** (Server Actions / server routes).
4. **Locks** own authorization truth; UI hints are not security.

---

## Other diagrams in this folder

Use **`signup-bootstrap-flow.md`**, **`role-surfaces.md`**, **`infrastructure-flow.md`**, **`core-transaction-sequence.md`** when the feature touches those concerns. See **`README.md`** for when to open each. **`system-map-full.md`** is for rare deep dives only.
