# Contract: authentication & session

**Status:** MVP  
**Code:** `proxy.ts`, `lib/supabase/middleware.ts`, `app/auth/callback/route.ts`, `app/auth/callback/recovery/route.ts`, `lib/auth-helpers.ts`, `lib/supabase/*`  
**SQL:** `scripts/004_create_profiles.sql`, `scripts/010a_add_enum_values.sql`, `scripts/010b_invite_system.sql`, `supabase/migrations/20260607193500_posts_mvp_base.sql`

## Purpose

Supabase Auth owns identity. ViZb owns profile, role, org membership, and product authorization through app gates plus Postgres RLS.

## Invariants

- Session refresh runs in the request proxy (`proxy.ts` → `lib/supabase/middleware.ts`); no business rules belong there.
- Protected prefixes are session-gated only: `/dashboard`, `/organizer`, `/admin`, `/tickets`, `/profile`.
- Fine-grained authorization happens in Server Components, Server Actions, and RLS.
- `profiles` rows are created by the database trigger `handle_new_user()`; application code must not insert profiles directly.
- Callback redirects must remain allowlisted / relative-safe; never accept arbitrary external redirect targets.
- Admin app gates use `profiles.platform_role = 'staff_admin'`. `profiles.role_admin` is legacy and should not be used for new authorization logic.

## Role model

| Persona | Gate | Data authority |
|---------|------|----------------|
| Guest | No session | Published rows only |
| Member | `requireAuth()` | `auth.uid()` + RLS |
| Organizer | `requireOrgMember(slug)` | `organization_members` + RLS helpers |
| Staff admin | `requireAdmin()` | `platform_role = 'staff_admin'` + `is_staff_admin()` |

`staff_support` exists in the enum but has no shipped app gate yet. Treat it as reserved until a separate policy/UX pass defines permissions.

## Auth surfaces

| Surface | Route / file |
|---------|--------------|
| Login | `app/login/page.tsx` |
| Signup | `app/signup/page.tsx` |
| PKCE callback | `app/auth/callback/route.ts` |
| Password reset request | `app/auth/forgot-password/page.tsx` |
| Password reset form | `app/auth/reset-password/page.tsx` |
| Recovery callback | `app/auth/callback/recovery/route.ts` |

Password recovery currently supports the default callback with `type=recovery` and the dedicated recovery callback route. Supabase redirect URL configuration must include the callback route used by the environment.

## Supabase clients

| Client | File | Rule |
|--------|------|------|
| Browser | `lib/supabase/client.ts` | Client auth flows and client reads only |
| Server | `lib/supabase/server.ts` | RSC, actions, most route handlers |
| Service role | `lib/supabase/service-role.ts` | Trusted server enclave only |

Never expose service role credentials to client code.

## Failure modes

| Symptom | First check |
|---------|-------------|
| Redirect loop | `proxy.ts`, `lib/supabase/middleware.ts`, callback redirect target |
| New user has no profile | `handle_new_user()` trigger and Supabase Auth logs |
| Admin route redirects to dashboard | `profiles.platform_role` is not `staff_admin` |
| Dev protected routes not gated | Supabase env missing; middleware intentionally skips enforcement outside production |

## Open consistency issue

Some older SQL/docs still reference `role_admin`, especially around subscribers. New docs and code should standardize on `platform_role` and leave `role_admin` as legacy compatibility until a migration removes or fully syncs it.
