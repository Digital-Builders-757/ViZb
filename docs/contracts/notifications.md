# Contract: notifications

**Status:** MVP — in-app dashboard notifications  
**SQL:** `supabase/migrations/20260405190000_user_notifications.sql`  
**Code:** `app/actions/notifications.ts`, `lib/notifications/dashboard-queries.ts`, `app/(dashboard)/layout.tsx`, `components/dashboard/*notification*`

## Purpose

Notifications power the dashboard bell/read state. This is an in-app inbox, not email/push.

## Storage

Table: `public.user_notifications`

| Field | Purpose |
|-------|---------|
| `user_id` | Recipient |
| `title` / `body` | Display copy |
| `kind` | UI/category hint |
| `read_at` | Null until read |
| `created_at` | Ordering |

## RLS expectations

- Members can select/update their own rows.
- Staff admin can insert rows for operational/admin tooling.
- No client-side service role; notification mutations go through server actions.

## Invariants

- Mark-one-read and mark-all-read are idempotent.
- Dashboard layout fetches notification count/feed as part of the authenticated shell.
- No provider secrets are involved; Resend/Supabase Auth email are separate systems.
- Notification copy should follow [docs/brand/CONTENT_PATTERNS.md](../brand/CONTENT_PATTERNS.md) where applicable.

## Failure modes

| Symptom | First check |
|---------|-------------|
| Bell is empty for everyone | `user_notifications` migration not applied |
| Mark read fails | RLS update policy or action error |
| Staff seed/broadcast fails | Staff role or insert policy |
