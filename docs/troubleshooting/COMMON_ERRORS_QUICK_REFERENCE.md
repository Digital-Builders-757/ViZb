# Common errors — quick reference

**Last updated:** April 17, 2026

Short, searchable fixes. For deeper debugging, use `/debug` and the architecture docs.

| Symptom | Likely cause | First checks |
|---------|--------------|--------------|
| Redirect loop after login | Middleware + callback disagree on “logged in” path | `middleware.ts`, `lib/supabase/middleware.ts`, `app/auth/callback/route.ts` |
| `profiles` row missing | Trigger not run or signup path bypassed DB | `scripts/004_create_profiles.sql`, Supabase logs |
| RLS violation / empty data | Policy mismatch or wrong client context | Spec §6, policy on table, use server client in RSC/actions |
| Waitlist / form insert fails | RLS or missing columns | `app/actions/subscribe.ts`, `scripts/001*`, `009*` |
| Type / column mismatch | Schema drift vs code | `database_schema_audit.md`, `scripts/*.sql`, spec §5 |
| Supabase insert/update fails with enum value error | App uses status value not in enum | Check `scripts/003_create_enums.sql`, `scripts/008_fix_enum_values.sql`, latest migrations |
| PowerShell error: “The string is missing the terminator” | Broken quoting in command | Re-run with single quotes, or move arguments into a file |
| `head` / bash command not found on Windows | Using unix utilities in PowerShell | Use `Select-Object -First N` or `cmd/findstr` |
| Sign-up confirmation never arrives; Supabase shows **Email address not authorized** | Default Supabase mail is **team-only** until you add **custom SMTP** | `docs/guides/SUPABASE_AUTH_EMAIL_RESEND.md` (Resend SMTP in Supabase); confirm **Authentication → URL Configuration** |
| `tsc` errors: **Cannot find module** `../../app/.../page.js` under `.next/types/validator.ts` | Stale Next.js generated types after removing/renaming routes | Delete the `.next` folder, run `npm run build` or `npm run ci` |
| `tsc` / VS Code: **Cannot find module** for a package listed in **`package.json`** (e.g. scanner / QR libs) | `node_modules` not installed or incomplete | Run **`npm install`**, then **`npm run typecheck`** |
| **`next build`**: lock at **`.next/lock`** or **ENOENT** under **`.next/server/`** | Parallel builds or interrupted build left `.next` partial | Stop other Next processes; delete **`.next`**, run **`npm run build`** (or **`npm run ci`**) once |
| GitHub Actions: weird **concurrency** / duplicate or stuck **PR CI** groups | Workflow used **`github.event.pull_request.number`** in `concurrency.group` but the workflow also runs on **`push`** (no PR payload) | Use **`${{ github.workflow }}-${{ github.ref }}`** (or another field defined for both event types); see merged fix in `.github/workflows/pr-ci.yml` |
| RSVP fails or **public event page** errors after deploy; **`published_event_rsvp_occupied_count`** missing | Migration **`20260410120000_event_rsvp_capacity.sql`** / `scripts/026_event_rsvp_capacity.sql` not applied on the target DB | Run **`supabase db push`** (or apply SQL in Dashboard); confirm `events.rsvp_capacity` column and function exist |
| **My tickets** empty or **`mint_free_rsvp_ticket_for_registration`** missing after RSVP | Tickets migration not applied | Apply **`20260410142142_tickets_core_free_rsvp.sql`** / **`scripts/028_tickets_core_free_rsvp.sql`**; confirm `public.tickets` and RPC exist |
| RSVP shows **saved** but **no ticket** / no QR; DB has **`event_registrations`** without **`tickets`** | Orphan registration (historical data or manual edit) | Reload **`/events/[slug]`** (app mints missing ticket for confirmed/checked_in); or run mint RPC in SQL for the registration id |
| Door **QR missing** on wallet or scanner returns **`scanner_not_configured`** | **`TICKET_QR_SECRET`** unset or too short in server env | Set **`TICKET_QR_SECRET`** (≥16 chars) per **`.env.example`**; redeploy; see **`docs/contracts/rsvps.md`** (Door QR) |
| Saving event categories fails with **check constraint** on **`events.categories`** | DB still on pre-**`open_mic`** constraint | Apply **`supabase/migrations/20260417202850_add_open_mic_event_category.sql`** (`supabase db push`) |
| Organizer **cannot save** ticket types; or anon **cannot** load public tier list | Migration **`20260410144936_ticket_types_org_crud_and_mint_tier.sql`** / **`029`** not applied | Run **`supabase db push`**; confirm `ticket_types` columns + INSERT/UPDATE/DELETE policies + anon SELECT on published events |
| **Paid** checkout succeeds in Stripe but **no ticket** / webhook logs show RPC error | Migration **`20260411120000_stripe_checkout_fulfillment.sql`** / **`030`** not applied, or **`SUPABASE_SERVICE_ROLE_KEY`** missing on server | Apply **`030`**; set service role in host env; confirm Stripe webhook URL **`/api/stripe/webhook`** and signing secret match **`STRIPE_WEBHOOK_SECRET`** |
| **`supabase db push`**: “inserted before the last migration” / out-of-order history | Remote has a newer migration version row than some local files | Run **`supabase db push --include-all`** (review pending list first) |
| **`function gen_random_bytes(integer) does not exist`** when applying ticket migrations | `pgcrypto` in **`extensions`** schema; session **`search_path`** lacks **`extensions`** | Apply **`20260410120500_enable_pgcrypto.sql`**; ensure ticket mint SQL uses **`extensions.gen_random_bytes(...)`** (see repo migrations **028–030** mirrors) |
| Stripe webhook returns **500** / retries | Fulfillment RPC failed or transient DB error — **intended** so Stripe redelivers (handler is idempotent on `stripe_checkout_session_id`) | Fix root cause (RLS, migration, metadata); replay event in Stripe Dashboard if needed |
| **Buy ticket** disabled or “not configured” on event page | Missing **`STRIPE_SECRET_KEY`** or **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** | Copy from **`.env.example`**; restart Next.js |
| **Admin → All Users**: no **Delete** / error says service role missing | **`SUPABASE_SERVICE_ROLE_KEY`** not loaded on the server | Set in `.env.local` per **`.env.example`**; never expose to the client; restart `npm run dev` |
| **Delete user** fails (500 / FK / cannot delete from `auth.users`) | Public tables still reference **`auth.users`** with default **`NO ACTION`** (e.g. `events.created_by`, `org_invites`) | Apply **`supabase/migrations/20260410200000_auth_user_delete_foreign_keys.sql`** (`supabase db push` or run SQL on the project) |
| **`git push`** rejected: **GH013** / **Required status check "main"** | Ruleset references a **check name that does not exist** (e.g. branch name mistaken for a check) or blocks all pushes | Set required checks to the real workflow job from **`.github/workflows/pr-ci.yml`**; see **`docs/development/BRANCHING.md`** (“Repository rulesets”) |
| Organizer **flyer upload** returns **400** for valid images (~**1–5MB**) | Next.js Server Actions default **`bodySizeLimit`** (**1MB**) rejects the multipart body before **`uploadEventFlyer`** runs | Raise **`experimental.serverActions.bodySizeLimit`** in **`next.config.mjs`** above app max file size + multipart overhead (ViZb: **6mb** transport, **5MB** file cap in **`lib/events/flyer-upload-constraints.ts`**) |

_Add rows as recurring issues appear._ `/ship` should append here when a fix addresses a repeatable failure mode.
