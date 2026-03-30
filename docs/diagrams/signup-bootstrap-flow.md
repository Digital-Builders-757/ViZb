# Signup & auth bootstrap flow — ViBE

**Last updated:** March 23, 2026

Conceptual map for **auth, callback, profile creation, and safe routes**. Pair with `docs/VIBE_APP_SPECIFICATION.md` (auth sections) and `scripts/004_create_profiles.sql`.

---

## High-level sequence

1. User submits signup or starts OAuth on **`/signup`** (or login on **`/login`**).
2. Supabase Auth completes; browser is redirected to **`/auth/callback`** (route handler refreshes session cookies — see `app/auth/callback/route.ts`).
3. **Database:** trigger **`handle_new_user`** creates **`profiles`** row (application code must not insert profiles as a workaround).
4. App redirects user into the correct **surface** (attendee dashboard, organizer path, etc.) per session + profile fields — exact rules live in middleware/helpers; avoid open redirects (allowlist targets).

---

## Zones (airport)

| Step | Zone |
|------|------|
| Cookie/session refresh, matcher | **Security** |
| Callback URL validation | **Security** + **Staff** (route handler) |
| `profiles` row | **Locks** (trigger) + **Staff** (reads via server client) |
| Post-auth landing UI | **Terminal** |

---

## “Safe” vs gated routes (conceptual)

- **Public / semi-public:** marketing **`/`**, event **Manifest** (`/events`, `/events/[slug]`), auth pages, legal/static pages as added.
- **Gated:** **`/dashboard`**, **`/profile`**, **`/organizer/*`**, **`/admin`**, invite claim flows — require valid session; middleware + RLS enforce access, not UI alone.

If debugging “redirect loop” or “no profile,” read **`signup-bootstrap-flow.md`** + **`docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`**.

---

## Red zone

Changes here require **`/redzone`**: `middleware.ts`, `lib/supabase/middleware.ts`, `app/auth/callback/route.ts`, profile trigger / RLS on `profiles`.
