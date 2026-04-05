# Product status report — ViBE

**Last updated:** April 2, 2026

**Purpose:** Short, stakeholder-facing snapshot of where the product stands. Engineering depth lives in **`docs/MVP_STATUS_ROADMAP.md`**.

## Current focus

- **Events + organizer workflow:** create → flyer → submit → review → publish, with role-scoped access.
- **Admin control tower:** review queue + management tools, now including **archive (soft delete)**.
- **Content loop:** Posts MVP is live; brand casing standardized to **VIZB** across UI copy.

## Risks / watchlist

- Schema/RLS drift vs app code — keep `scripts/*.sql` + `database_schema_audit.md` aligned.
- “Published edits update immediately” for org admins — good for velocity, but needs discipline (audit logs later).
- Lack of CI enforcement (intentional for speed) — mitigate with strict preflight habits.

## Next 30–60 days

1) **Ticketing v1 (free RSVP):** minimal schema + entitlement model + attendee wallet.
2) **Door/check-in v1:** organizer/staff check-in surface + auditability.
3) **CI guardrails (phased):** add GitHub Actions as non-blocking first, then enforce once stable.
4) **Conversion polish:** OG metadata across share surfaces + signup/subscribe hooks.

