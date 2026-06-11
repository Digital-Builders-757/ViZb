# Contract: member profiles

**Status:** MVP  
**SQL:** `scripts/004_create_profiles.sql`, `scripts/006_rls_security_fixes.sql`, `scripts/007_column_privileges_hardening.sql`, `scripts/010a_add_enum_values.sql`, `scripts/010b_invite_system.sql`, `supabase/migrations/20260607193500_posts_mvp_base.sql`  
**Code:** `app/(dashboard)/profile/page.tsx`, `components/dashboard/profile-form.tsx`, `app/actions/profile.ts`, `lib/auth-helpers.ts`

## Purpose

`profiles` is the app-owned extension of Supabase Auth users. It stores display identity and platform role metadata used by dashboards and staff gates.

## Invariants

- App code does **not** insert `profiles` on signup. `handle_new_user()` creates the row from `auth.users`.
- Members can update only safe profile fields, currently display/avatar-style fields through `app/actions/profile.ts`.
- Staff admin gates use `profiles.platform_role = 'staff_admin'`.
- `role_admin` is legacy compatibility, not the primary app authorization field.
- Column privileges and RLS must prevent users from self-promoting platform/admin fields.

## Key columns

| Column | Purpose |
|--------|---------|
| `id` | Matches `auth.users.id` |
| `email` | Auth email mirror / lookup |
| `display_name` | Public/member-facing name |
| `avatar_url` | Optional profile image |
| `platform_role` | `user`, `staff_admin`, reserved `staff_support` |
| `role_admin` | Legacy boolean; avoid for new app gates |

## Failure modes

| Symptom | First check |
|---------|-------------|
| Dashboard/profile 404 or redirect loop | Missing `profiles` row / trigger issue |
| Staff cannot access `/admin` | `platform_role` not `staff_admin` |
| User can update role fields | Column privileges/RLS regression |

## Member preferences

Culture preferences live in **`member_preferences`** (see **`20260611201910_member_preferences.sql`**): home cities, categories, reminder channel toggles, onboarding timestamp. Edited on **`/profile`** and first-run **`/dashboard`**.

Contract: **`docs/contracts/member_profiles.md`** (profile identity) + preference fields in **`lib/member/preferences.ts`**.
