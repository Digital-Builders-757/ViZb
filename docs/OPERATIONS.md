# Operations

**Last updated:** June 10, 2026  
**Audience:** Operators, release engineers, on-call

Runtime assumptions, deploy flow, integrations, background work, and troubleshooting entry points for ViZb.

---

## Runtime assumptions

| Assumption | Detail |
|------------|--------|
| Host | Vercel (Node.js serverless / fluid compute) |
| Database | Hosted Supabase Postgres 17 — not bundled with the app |
| Auth | Supabase Auth cookie session; refreshed on every matched request via `proxy.ts` |
| Static assets | `public/` + Supabase Storage public URLs |
| No background workers | Hourly Vercel cron **`/api/cron/event-reminders`** (requires **`CRON_SECRET`** + service role) |
| Async payments | Stripe webhooks only — never trust client redirect |
| Inventory | DB triggers recalculate `ticket_types.quantity_sold` |

**Production without Supabase env:** `lib/supabase/middleware.ts` throws in production if URL/key missing.

---

## Deployment flow

### Branching

```
feat/* → PR → develop → (release PR) → main → Vercel production
```

- **Integration:** `develop` — all feature PRs land here
- **Production:** `main` — only `develop` → `main` merge-commit PRs (enforced by `release-guard.yml`)
- Details: [development/BRANCHING.md](./development/BRANCHING.md)

### Pre-deploy checklist

1. **Migrations applied** to target Supabase project (`supabase migration list` — Local = Remote)
2. **Env vars** set on Vercel for that environment
3. **`npm run ci`** green on `develop`
4. **Smoke tests** per [release/SMOKE_TEST.md](./release/SMOKE_TEST.md)

### Release sequence

1. Verify `develop` is green in CI
2. Open PR `develop` → `main` (merge commit, not squash)
3. After merge, Vercel promotes production deployment
4. Run post-deploy smoke: auth, event detail, RSVP or checkout (staging first if available)
5. Archive release notes via `/release` → `docs/releasenotes/`

Full policy: [development/RELEASING.md](./development/RELEASING.md)

---

## Database operations

### Dual SQL tracks

| Track | Path | Apply method |
|-------|------|--------------|
| Bootstrap | `scripts/*.sql` | Supabase SQL Editor, numeric order |
| CLI deltas | `supabase/migrations/*.sql` | `supabase db push` |

**Existing projects:** Base schema from `scripts/`; ongoing changes via CLI migrations.

**Greenfield warning:** `supabase db reset` from migrations alone will **not** recreate full schema. Bootstrap `scripts/001`–`024` minimum before CLI push.

### Apply pending migrations

```powershell
supabase login
supabase link --project-ref <ref>
supabase migration list
supabase db push
```

Post-checks: [operations/SUPABASE_PRODUCTION_MIGRATIONS.md](./operations/SUPABASE_PRODUCTION_MIGRATIONS.md)

### Critical migrations for current app

| Migration | Required for |
|-----------|--------------|
| `20260410120500_enable_pgcrypto` | Ticket code generation |
| `20260410142142_tickets_core_free_rsvp` | Ticketing tables |
| `20260411120000_stripe_checkout_fulfillment` | Stripe RPC (older) |
| `20260606000500_stripe_ticketing_mvp_upgrade` | **`fulfill_stripe_ticket_order`**, `webhook_logs`, platform fees |
| `20260420224705_storage_buckets_*` | Flyer/post uploads |
| `20260505163945_add_event_kind_*` | Community listings |
| `20260505184652_event_staff_pick_*` | Trust signals |
| `20260410200000_auth_user_delete_*` | Admin user delete |
| `20260607193500_posts_mvp_base` | Admin posts CMS (idempotent base) |
| `20260610043000_fix_event_archive_rls_with_check` | Event archive — RLS `WITH CHECK` allows `status = archived`; re-archive events "archived" before this fix |

### Rollback mindset

Migrations are forward-only. Rollback = redeploy previous app version + restore DB snapshot.

---

## Environment variables (Vercel)

Canonical template: `.env.example`. Set per environment in Vercel dashboard or `vercel env`.

### Required (core app)

| Variable | Environment |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `NEXT_PUBLIC_SITE_URL` | All — use canonical public hostname (www vs apex) |

### Required (feature-specific)

| Feature | Variables |
|---------|-----------|
| Paid checkout | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Webhook fulfillment | `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` |
| Platform service fee (optional) | `TICKET_PLATFORM_FEE_PERCENT`, `TICKET_PLATFORM_FEE_FIXED_CENTS` |
| Door scanner | `TICKET_QR_SECRET` |
| Admin user delete | `SUPABASE_SERVICE_ROLE_KEY` |
| Advertise form | `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_EMAIL` |
| Wallet passes | `APPLE_WALLET_*`, `GOOGLE_WALLET_*`, `TICKET_BARCODE_HMAC_SECRET` |

### Auth email

Sign-up and password emails are sent by **Supabase Auth**, not the app. Configure Resend as custom SMTP in Supabase Dashboard. Guide: [guides/SUPABASE_AUTH_EMAIL_RESEND.md](./guides/SUPABASE_AUTH_EMAIL_RESEND.md)

### Sentry

`.env.example` lists `SENTRY_*` variables. **No `@sentry` SDK is wired in app code** — monitoring is not active until integrated. Treat as planned/optional.

### Application logging (active)

Server-side failures log to **Vercel/host stdout** via `lib/log.ts`:

| Scope prefix | Where | When |
|--------------|-------|------|
| `[admin.posts.save]` | Post editor server action | Validation or DB failure on update |
| `[admin.posts.create]` | New post server action | Validation or DB failure on insert |
| `[admin.posts.counts]` | Admin posts list counts | Count query failure |
| `[admin.overview]` | `/admin` dashboard | Parallel Supabase query failure |
| `[events.discovery]` | `/events` listing | Published events query failure |
| `[events.my_vibes]` | Saved events queries | `event_saves` read failure |
| `[events.view_beacon]` | `POST /api/events/[slug]/view` | View counter RPC failure |

**Rules:** Log messages and safe metadata only — never service role keys, webhook secrets, or user passwords. Admin UI surfaces actionable banners where staff can act (post save errors, events load failure, overview partial load).

Troubleshooting table: `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`.

---

## Integrations

| Service | Ingress / egress | Failure symptom |
|---------|------------------|-----------------|
| **Supabase** | All reads/writes | 500s, empty data, RLS errors |
| **Stripe** | Webhook POST `/api/stripe/webhook` | Tickets not minted after payment |
| **Resend** | `advertise-contact` action | Partnership form fails |
| **Vercel Analytics** | Client script in layout; product funnel events via `lib/analytics/product-events.ts` — see **`docs/analytics/PRODUCT_EVENTS.md`** | Silent — no user impact |
| **Apple/Google Wallet** | GET pass routes | Buttons hidden or 503 |

### Stripe webhook setup

1. Dashboard or CLI: point webhook to `https://<domain>/api/stripe/webhook`
2. Events: `checkout.session.completed`, `payment_intent.payment_failed`, `checkout.session.expired`
3. Set `STRIPE_WEBHOOK_SECRET` on Vercel
4. Ensure `20260606000500` migration applied (RPC `fulfill_stripe_ticket_order`)

Webhook uses **service role** — missing key returns 503.

### Admin Stripe ops tooling (June 2026)

| Tool | Route | Purpose |
|------|-------|---------|
| Stripe readiness diagnostics | `/admin/diagnostics/stripe` | Per-environment env pass/fail checks + expected webhook URL (#125) |
| Ticket revenue ledger | `/admin/revenue` | Paid-order ledger: ticket subtotal vs ViZb service fee (#126) |
| Return-path fulfillment sync | automatic on `?session_id=` return | `syncPaidTicketCheckoutSession` fulfills paid orders when webhooks are delayed/misconfigured (e.g. Vercel Preview) (#129) |

### Event archive ops

`archiveEvent` / `unarchiveEvent` (`app/actions/event.ts`) run with **service role** + row-count verification and revalidate public discovery paths. Requires migration `20260610043000` — events "archived" before that fix were silently blocked by RLS and must be re-archived.

---

## Background jobs and async work

| Mechanism | What it does |
|-----------|--------------|
| Stripe webhook | Order fulfillment, ticket mint, path revalidation |
| DB triggers | `quantity_sold` recalc, `updated_at`, review field guards |
| View beacon | `POST /api/events/[slug]/view` → RPC increment (fire-and-forget) |
| Vercel cron | **`GET /api/cron/event-reminders`** hourly — My Vibes in-app + email reminders (Bearer **`CRON_SECRET`**, service role) |

Set **`CRON_SECRET`** in Vercel; enable cron via **`vercel.json`**. Manual test: `curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/event-reminders`.

---

## Storage operations

| Bucket | Created by | Ops note |
|--------|------------|----------|
| `event-flyers` | migrations `014`, `20260420224705` | Path `{org_id}/{event_id}/...` |
| `post-covers` | `20260420180000`, combined migration | Staff-only write |
| `posts` | `20260420224705` | Body gallery images |

Missing buckets → upload errors in flyer/post flows. Apply storage migrations before enabling CMS/flyer features.

---

## CI/CD

| Workflow | Trigger | What it runs |
|----------|---------|--------------|
| `pr-ci.yml` | PR to `develop`/`main`; push to `develop` | `npm run ci` + `npm run test:e2e` |
| `release-guard.yml` | PR to `main` | Enforces head branch = `develop` |

Local equivalent before push: `npm run ci && npm run test:e2e`

**Known process mismatch:** [development/BRANCHING.md](./development/BRANCHING.md) and [development/RELEASING.md](./development/RELEASING.md) describe hotfix PRs to `main`, but `release-guard.yml` currently allows only `develop` as the head branch for `main` PRs. Until that workflow is changed, production hotfixes should either go through `develop` or be explicitly coordinated before opening a `fix/*` → `main` PR.

**Coverage gap:** CI does not verify Supabase migration parity and does not currently exercise Stripe webhook fulfillment end-to-end.

---

## Failure points and troubleshooting

Primary runbook: [troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md](./troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md)

| Symptom | Likely cause | First check |
|---------|--------------|-------------|
| Empty notifications bell | `user_notifications` not migrated | `supabase migration list` |
| RSVP constraint error | Status/timestamp CHECK not applied | `EVENT_REGISTRATIONS_AUDIT.md` |
| Paid ticket not appearing | Webhook 500 or RPC missing | Stripe dashboard + `webhook_logs` table |
| Scanner 503 | `TICKET_QR_SECRET` unset | Vercel env |
| Upload "bucket not found" | Storage migration not applied | `20260420224705` |
| Wrong project data | `NEXT_PUBLIC_SUPABASE_URL` mismatch | Compare Vercel env to intended project |
| Admin cannot access | `platform_role` not `staff_admin` | SQL update on `profiles` |
| Webhook retries forever | 500 from missing service role or RPC | Logs + migration `20260606000500` |
| Admin user list missing | `admin_list_users` RPC absent or remote-only | Confirm RPC exists on target Supabase project |
| Archived event still public | RLS `WITH CHECK` blocked archive pre-fix | Apply `20260610043000`, then re-archive the event |
| Stripe env doubt per environment | Misconfigured keys/webhook | `/admin/diagnostics/stripe` |

### Wallet passes

Optional setup: [operations/WALLET_PASSES_SETUP.md](./operations/WALLET_PASSES_SETUP.md)

### Notifications QA

Seed and verify: [database/NOTIFICATIONS_QA_SEED.md](./database/NOTIFICATIONS_QA_SEED.md)

---

## Local Supabase (optional)

`supabase/config.toml` exists (Postgres 17). `supabase/seed.sql` is **referenced but may be missing** — `db reset` seed step can fail.

Default team workflow: **hosted Supabase** + `.env.local`. See [guides/LOCAL_DEV_AND_AUTH.md](./guides/LOCAL_DEV_AND_AUTH.md).

CLI migrations are not a full greenfield rebuild path by themselves. Base tables/enums/helpers still depend on the historical `scripts/` bootstrap track.

---

## Security operations

| Area | Note |
|------|------|
| Service role key | Never expose to client; rotate if leaked |
| RLS | All public tables must have policies |
| `proxy.ts` | Session only — no business rules |
| Webhook | Signature verification required before processing |
| Column privileges | Users cannot self-promote `platform_role` |

Red zone changes: use `/redzone` workflow. See [ARCHITECTURE_CONSTITUTION.md](./ARCHITECTURE_CONSTITUTION.md).

---

## Related

- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) — architecture and integration boundaries
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) — local dev and migration workflow
- [database/MIGRATIONS.md](./database/MIGRATIONS.md) — script apply order
