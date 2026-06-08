# Journey: member joins community

**Status:** MVP  
**Contracts:** `auth.md`, `member_profiles.md`  
**Routes:** `/signup`, `/login`, `/auth/callback`, `/dashboard`, `/invite/claim`

## Happy path — signup

1. Guest creates an account from `/signup`.
2. Supabase Auth creates the user.
3. `handle_new_user()` creates the `profiles` row.
4. User confirms email if the Supabase project requires confirmation.
5. `/auth/callback` exchanges the auth code and redirects to `/dashboard` or the safe `redirect` target.
6. Dashboard loads member profile, org memberships, notifications, My Vibes, and tickets.

## Happy path — invite claim

1. Staff/admin creates an invite for an org.
2. User opens `/invite/claim?token=...`.
3. If signed out, user signs in first.
4. `claimInvite` calls the `claim_invite` RPC.
5. User becomes an org member and can access `/organizer/[slug]`.

## Acceptance

- No route should insert `profiles` directly.
- Invite token is not the authorization boundary by itself; action requires an authenticated user.
- Claimed invite strips token from the URL where the UI flow supports it.
- Protected routes redirect signed-out users to `/login?redirect=...`.
- Admin/staff access still requires `platform_role`, not just membership.
