# Product status report — ViBE

**Last updated:** April 11, 2026

**Purpose:** Short, stakeholder-facing snapshot of where the product stands. Engineering depth lives in **`docs/MVP_STATUS_ROADMAP.md`**.

## Current focus

- **Events + organizer workflow:** create → flyer → submit → review → publish, with role-scoped access.
- **Ticketing:** Free RSVP → **`tickets`**; optional RSVP / tier caps; organizer **ticket types** (free + **paid USD**); **Stripe Checkout** + webhook when env and DB migration **`030`** are applied.
- **Admin control tower:** review queue + management tools, including **archive (soft delete)**.
- **Content loop:** Posts MVP is live; brand casing standardized to **VIZB** across UI copy.

## Risks / watchlist

- Schema/RLS drift vs app code — keep `scripts/*.sql`, `supabase/migrations/`, and `database_schema_audit.md` aligned.
- “Published edits update immediately” for org admins — good for velocity, but needs discipline (audit logs later).
- **Paid checkout** needs Stripe keys + webhook + migration **`030`** per environment — do not promise card checkout until those are verified on that host.

## Next 30–60 days

1) **Payments hardening:** Stripe Tax alignment, refund UX, basic revenue reporting; optional Connect later.
2) **Door/check-in polish:** dedicated door surface, scanner-ready QR, realtime counts where useful.
3) **CI / release hygiene:** keep **`develop` → `main`** release PRs gated (see `docs/development/BRANCHING.md`).
4) **Conversion polish:** OG metadata across share surfaces + signup/subscribe hooks.

