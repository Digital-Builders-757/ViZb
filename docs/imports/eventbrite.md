# Eventbrite organization import (#259)

## Status: implemented but parked

The Eventbrite importer is retained as an optional organization-owned catalog adapter, but production activation is intentionally deferred while ViZb prioritizes multi-source local discovery and ViZb-native ticketing.

Important product boundary:

- This adapter imports events owned by one configured Eventbrite organization.
- It is not a public geographic search feed for all nearby Eventbrite events.
- Keep `EVENTBRITE_IMPORT_ENABLED=false` unless product leadership explicitly reactivates the adapter.
- Do not add production Eventbrite credentials or enable the cron during the local event ingestion initiative.
- Do not treat an imported Eventbrite listing as authorization for ViZb to sell tickets.
- Revisit this adapter later for partner migration or optional sync after organizer ownership, attribution, and attendee handoff policies are approved.

Active replacement direction:

- Epic: #265
- Architecture and operations: `docs/imports/LOCAL_EVENT_INGESTION.md`
- Roadmap: `docs/roadmaps/LOCAL_EVENT_INGESTION_ROADMAP.md`

The implementation and setup details below remain available for future reactivation.

---

Server-side pipeline (post-#266): Eventbrite organization events → **`event_candidates`** (pending review) → staff approval (#270) → canonical **`events`** row → public `/events` timeline.

Legacy note: rows imported before #266 may still exist directly on **`events`** with `source = eventbrite`. The admin queue at `/admin/events/imports` reads those legacy rows until #270 rewrites the queue to `event_candidates`.

## Environment variables (server-only)

Add to `.env.local` (local) and Vercel **Production** only when reactivating this adapter (never `NEXT_PUBLIC_*`):

| Variable | Description |
|----------|-------------|
| `EVENTBRITE_PRIVATE_TOKEN` | Private API token from Eventbrite |
| `EVENTBRITE_ORGANIZATION_ID` | Numeric org id for `/organizations/{id}/events/` |
| `EVENTBRITE_IMPORT_ENABLED` | `true` / `false` — master switch; keep `false` while parked |
| `EVENTBRITE_IMPORT_LOOKAHEAD_DAYS` | Days ahead to fetch (default `90`) |
| `EVENTBRITE_IMPORT_DEFAULT_STATUS` | Default `pending_review` |

Also required for imports:

- `SUPABASE_SERVICE_ROLE_KEY` — candidate upserts bypass RLS
- `CRON_SECRET` — scheduled job auth on Vercel
- `event_sources.enabled_in_db = true` for `eventbrite` (in addition to env flag)

See [`.env.example`](../../.env.example).

## Local manual run

Only use this procedure when intentionally testing or reactivating the parked adapter.

1. Set env vars and `EVENTBRITE_IMPORT_ENABLED=true`.
2. Enable the source in the registry: `UPDATE event_sources SET enabled_in_db = true WHERE source_key = 'eventbrite';`
3. Log in as `staff_admin`.
4. Verify readiness: `GET /api/admin/imports/sources`
5. Open **Admin → Eventbrite imports** (`/admin/events/imports`) and click **Run import now**, or:

```bash
curl -X POST -b "your-session-cookie" https://localhost:3000/api/admin/imports/eventbrite/run
```

(Use browser devtools or an authenticated session; the route requires staff admin.)

## Admin workflow

1. Import creates rows in **`event_candidates`** with `source_key = eventbrite`, `review_status = pending_review`.
2. Review queue UI rewrite is **#270** — until then, inspect candidates via Supabase or staff SQL; legacy **`events`** rows from pre-#266 imports remain in `/admin/events/imports`.
3. **Approve** (future #270) creates or links a canonical **`events`** row. **Reject** stores reason and suppression policy on the candidate.

## Staff readiness API

```bash
curl -b "your-session-cookie" https://localhost:3000/api/admin/imports/sources
curl -b "your-session-cookie" https://localhost:3000/api/admin/imports/sources/eventbrite/health
```

## Vercel cron

`vercel.json` schedules `GET /api/cron/eventbrite-import` every 6 hours (`0 */6 * * *`). The route should remain inert while `EVENTBRITE_IMPORT_ENABLED=false`.

Enable on Vercel only after an explicit reactivation decision:

1. Set all Eventbrite env vars + `EVENTBRITE_IMPORT_ENABLED=true`.
2. Set `CRON_SECRET` (Vercel injects `Authorization: Bearer …` on cron requests).

Manual cron test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-host>/api/cron/eventbrite-import
```

## Security

- Eventbrite token is only read in `lib/eventbrite/*` and import runner (never client components).
- Do not add `EVENTBRITE_*` to client bundles or `NEXT_PUBLIC_*` names.
- Imported listing data does not establish organizer ownership or native ticketing rights.

## Verification checklist

- [ ] Product has explicitly approved reactivation.
- [ ] Missing token → import returns error / skipped safely
- [ ] Import creates `event_candidates` with `review_status = pending_review`
- [ ] Re-run does not duplicate (`source_key` + `source_event_id` unique)
- [ ] Admin approve → event on `/events`
- [ ] Admin reject → not on public timeline
- [ ] Public CTA and source attribution match the approved product policy
- [ ] No native ViZb ticket inventory is created without verified organizer authorization
- [ ] `grep EVENTBRITE_ components/` returns no matches
