# Notifications — QA seed (repeatable tests)

**Table:** `public.user_notifications` (see `supabase/migrations/20260405190000_user_notifications.sql`)

Use these when you need an unread row **without** waiting for product triggers.

## Option A — Admin UI (preferred)

1. Sign in as **`staff_admin`**.
2. Open **`/admin`** → section **QA — Notifications**.
3. Click **Seed test notification** (creates one unread row for **your** user).
4. Open the bell on mobile header or desktop sidebar: badge increments.
5. Open the menu → tap a row (marks read if unread) or **Mark all as read**.

Server action: `seedStaffTestNotification` in `app/actions/notifications.ts` (staff-only).

## Option B — SQL (any user id)

Run in Supabase SQL Editor (service role or sufficient privileges):

```sql
INSERT INTO public.user_notifications (user_id, title, body, href)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,  -- replace with target auth.users.id
  '[QA] SQL seed',
  'Manual insert for bell + unread count checks.',
  '/dashboard'
);
```

Replace the UUID with the real user. RLS in the dashboard uses the **member** session; inserts from the app for non-staff must go through product logic — this SQL path is for **operators**.

## Consistency checklist

- [ ] Unread count on the bell matches `SELECT count(*) FROM user_notifications WHERE user_id = ? AND read_at IS NULL`.
- [ ] After **Mark all as read**, count is zero and menu shows the empty state copy.
- [ ] Sidebar (desktop) and mobile header show the **same** counts (both read the same server payload from `app/(dashboard)/layout.tsx`).
