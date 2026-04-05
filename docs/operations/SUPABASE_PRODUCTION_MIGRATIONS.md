# Supabase migrations — deployment hygiene

**Related:** `docs/database/MIGRATIONS.md`, `supabase/migrations/*`, `docs/database/EVENT_REGISTRATIONS_AUDIT.md`

## Why this exists

Application features (notifications inbox, RSVP constraints) depend on **remote** Postgres schema. Shipping code to Vercel without applying migrations produces “empty bell” errors or subtle data bugs.

## Preconditions

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in (`supabase login`).
- Project linked: `supabase link --project-ref <ref>` at repo root (writes to `.temp` / local config — do not commit secrets).
- You know whether you are targeting **staging** vs **production** project refs.

## 1. Compare local migrations vs remote

```powershell
cd <repo-root>
supabase migration list
```

Expect **Local** and **Remote** columns to match for every row. A version present locally but blank under **Remote** is **not applied** on the linked database.

Example (pending rows):

| Local          | Remote |
|----------------|--------|
| 20260405190000 |        |
| 20260405191000 |        |

## 2. Apply pending migrations

**Staging / prod (linked project):**

```powershell
supabase db push
```

Review the SQL Supabase is about to run. For production, prefer a maintenance window or pipeline gate that runs the same command after review.

**Never** hand-edit applied migration files; add a new timestamped file instead.

## 3. Verify notifications (`user_notifications`)

After `20260405190000_*` is applied:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_notifications';
SELECT polname FROM pg_policies WHERE tablename = 'user_notifications' ORDER BY polname;
```

In the app: staff uses **Admin → QA — Notifications** (or the SQL in `docs/database/NOTIFICATIONS_QA_SEED.md`), then confirm the bell shows unread and **Mark all as read** clears the badge.

## 4. Verify RSVP CHECK constraints (`event_registrations`)

After `20260405191000_*` is applied, run the **Post-migration verification** and audit queries in `docs/database/EVENT_REGISTRATIONS_AUDIT.md`.

**Smoke test (production or staging):**

1. RSVP to a published event as a member.
2. Cancel RSVP → confirm row has `cancelled_at` set.
3. Organizer/staff check-in → confirm `checked_in_at` set.
4. Undo check-in → confirm back to `confirmed` with timestamps cleared.

If any step fails with a constraint error, fix data using the **Preconditions** section of `EVENT_REGISTRATIONS_AUDIT.md` before retrying.

## 5. Rollback mindset

Forward-only migrations are the default. Rollback is redeploy app + restore DB snapshot — plan backups before risky pushes.
