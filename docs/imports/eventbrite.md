# Eventbrite import (#259)

Server-side pipeline: Eventbrite organization events → Supabase `events` (pending review) → admin approval → public `/events` timeline.

## Environment variables (server-only)

Add to `.env.local` (local) and Vercel **Production** (never `NEXT_PUBLIC_*`):

| Variable | Description |
|----------|-------------|
| `EVENTBRITE_PRIVATE_TOKEN` | Private API token from Eventbrite |
| `EVENTBRITE_ORGANIZATION_ID` | Numeric org id for `/organizations/{id}/events/` |
| `EVENTBRITE_IMPORT_ENABLED` | `true` / `false` — master switch |
| `EVENTBRITE_IMPORT_LOOKAHEAD_DAYS` | Days ahead to fetch (default `90`) |
| `EVENTBRITE_IMPORT_DEFAULT_STATUS` | Default `pending_review` |

Also required for imports:

- `SUPABASE_SERVICE_ROLE_KEY` — upserts bypass RLS
- `CRON_SECRET` — scheduled job auth on Vercel
- Platform org exists (`PLATFORM_ORG_SLUG`, default `vizb`)

See [`.env.example`](../../.env.example).

## Local manual run

1. Set env vars and `EVENTBRITE_IMPORT_ENABLED=true`.
2. Log in as `staff_admin`.
3. Open **Admin → Eventbrite imports** (`/admin/events/imports`) and click **Run import now**, or:

```bash
curl -X POST -b "your-session-cookie" https://localhost:3000/api/admin/imports/eventbrite/run
```

(Use browser devtools or an authenticated session; the route requires staff admin.)

## Admin workflow

1. Import creates rows with `source = eventbrite`, `status = pending_review`, `event_kind = community`.
2. Review at `/admin/events/imports` — approve, reject (optional reason), edit via `/admin/events/[id]`.
3. **Approve** sets `status = published` (visible on `/events`). **Reject** keeps the row internal.

## Vercel cron

`vercel.json` schedules `GET /api/cron/eventbrite-import` every 6 hours (`0 */6 * * *`).

Enable on Vercel:

1. Set all Eventbrite env vars + `EVENTBRITE_IMPORT_ENABLED=true`.
2. Set `CRON_SECRET` (Vercel injects `Authorization: Bearer …` on cron requests).

Manual cron test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-host>/api/cron/eventbrite-import
```

## Security

- Eventbrite token is only read in `lib/eventbrite/*` and import runner (never client components).
- Do not add `EVENTBRITE_*` to client bundles or `NEXT_PUBLIC_*` names.

## Verification checklist

- [ ] Missing token → import returns error / skipped safely
- [ ] Import creates `pending_review` rows
- [ ] Re-run does not duplicate (`source` + `source_event_id` unique)
- [ ] Admin approve → event on `/events`
- [ ] Admin reject → not on public timeline
- [ ] `grep EVENTBRITE_ components/` returns no matches
