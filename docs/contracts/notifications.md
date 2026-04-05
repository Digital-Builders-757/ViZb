# Contract: notifications

**Status:** MVP (in-app inbox)

## Storage

- Table: `public.user_notifications` (see `supabase/migrations/20260405190000_user_notifications.sql`).
- RLS: members **select/update** own rows; **insert** is `staff_admin` only (broadcasts / tooling).

## Invariants (target)

- No secrets in client bundles; provider keys server-only.  
- Templates match `docs/brand/CONTENT_PATTERNS.md`.
- “Mark all as read” and single-row read markers are **idempotent** (Server Actions in `app/actions/notifications.ts`).
