# Common errors — quick reference

**Last updated:** March 23, 2026

Short, searchable fixes. For deeper debugging, use `/debug` and the architecture docs.

| Symptom | Likely cause | First checks |
|---------|--------------|--------------|
| Redirect loop after login | Middleware + callback disagree on “logged in” path | `middleware.ts`, `lib/supabase/middleware.ts`, `app/auth/callback/route.ts` |
| `profiles` row missing | Trigger not run or signup path bypassed DB | `scripts/004_create_profiles.sql`, Supabase logs |
| RLS violation / empty data | Policy mismatch or wrong client context | Spec §6, policy on table, use server client in RSC/actions |
| Waitlist / form insert fails | RLS or missing columns | `app/actions/subscribe.ts`, `scripts/001*`, `009*` |
| Type / column mismatch | Schema drift vs code | `database_schema_audit.md`, `scripts/*.sql`, spec §5 |

_Add rows as recurring issues appear._ `/ship` should append here when a fix addresses a repeatable failure mode.
