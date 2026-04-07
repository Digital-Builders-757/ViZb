# Auth errors — inventory (ViZb)

Shared UI: `components/auth/auth-alert.tsx`  
Mapping: `lib/auth/auth-error-map.ts` (`mapAuthError`)

| Route | User action | Error source | Current UX |
| --- | --- | --- | --- |
| `/signup` | Submit sign-up | Supabase `auth.signUp` (HTTP / SDK), client validation | `AuthAlert` + field hints; mapped copy; “Try again” / support row when not “account exists” |
| `/login` | Submit sign-in | Supabase `auth.signInWithPassword` | `AuthAlert` + support row; “Forgot password?” next to password label |
| `/auth/sign-up-success` | Resend confirmation | Supabase `auth.resend({ type: 'signup' })` | `AuthAlert` success / error / warning from mapper (`verify` context) |
| `/auth/forgot-password` | Request reset email | Supabase `auth.resetPasswordForEmail` | `AuthAlert` on failure; success state after send |
| `/auth/callback` | OAuth / PKCE exchange | `exchangeCodeForSession` failure → redirect | Redirect only (no inline UI on route) |
| `/auth/error` | (arrival from failed callback) | Missing or invalid `code` after auth redirect | `AuthAlert` + `AppShell` / `GlassCard` + CTAs to sign-in / sign-up |

**Not used in-repo (searched):** `signInWithOtp`, magic-link-only flows, server-side `resetPasswordForEmail` wrappers beyond the new page.

**Tests**

- Unit: `lib/auth/__tests__/auth-error-map.test.ts`
- E2E (mocked Supabase HTTP): `tests/e2e/auth-errors.spec.ts`, `npm run test:e2e`

Regenerate screenshots in `docs/plans/auth-error-ux/` via the Playwright project **Auth error screenshots** in `tests/e2e/auth-errors.spec.ts`.
