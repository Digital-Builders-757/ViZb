# Common errors — quick reference

**Last updated:** April 7, 2026

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

_Add rows as recurring issues appear._ `/ship` should append here when a fix addresses a repeatable failure mode.
