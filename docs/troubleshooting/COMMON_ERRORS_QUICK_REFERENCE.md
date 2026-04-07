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
| Door scan API returns **503** / wallet shows “QR unavailable” | `TICKET_QR_SECRET` missing or shorter than 16 chars | Set in `.env.local` (see `.env.example`); restart dev server; same secret server-wide |

_Add rows as recurring issues appear._ `/ship` should append here when a fix addresses a repeatable failure mode.
