# Contract: notifications

**Status:** MVP — in-app dashboard notifications + hourly event reminders  
**SQL:** `supabase/migrations/20260405190000_user_notifications.sql`, `supabase/migrations/20260611213000_notification_dedup_key.sql`  
**Code:** `app/actions/notifications.ts`, `lib/notifications/dashboard-queries.ts`, `lib/notifications/my-vibes-reminders.ts`, `app/api/cron/event-reminders/route.ts`, `app/(dashboard)/layout.tsx`, `components/dashboard/*notification*`

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
| `dedup_key` | Optional idempotency key for cron reminders (unique per user when set) |
| `created_at` | Ordering |

## RLS expectations

- Members can select/update their own rows.
- Staff admin can insert rows for operational/admin tooling.
- No client-side service role; notification mutations go through server actions.

## Invariants

- Mark-one-read and mark-all-read are idempotent.
- Dashboard layout fetches notification count/feed as part of the authenticated shell.
- Cron route **`GET /api/cron/event-reminders`** (hourly via **`vercel.json`**) inserts deduped My Vibes reminders for saved published events at ~24h and ~2h windows using **`user_notifications.dedup_key`**. Requires **`CRON_SECRET`** in production and **`SUPABASE_SERVICE_ROLE_KEY`**.
- No provider secrets are involved for in-app rows; Resend/Supabase Auth email are separate systems.
- Notification copy should follow [docs/brand/CONTENT_PATTERNS.md](../brand/CONTENT_PATTERNS.md) where applicable.
- My Vibes / ticket reminders: hourly cron inserts rows for saved or ticketed published events in **24h** and **2h** windows when **`member_preferences.in_app_reminders`** is true (default on).
- Email reminders use Resend when configured; see **`lib/email/event-reminder-mailer.ts`** and **`member_preferences.email_reminders`**.

## Failure modes

| Symptom | First check |
|---------|-------------|
| Bell is empty for everyone | `user_notifications` migration not applied |
| Mark read fails | RLS update policy or action error |
| Staff seed/broadcast fails | Staff role or insert policy |
