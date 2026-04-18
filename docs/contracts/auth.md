# Contract: authentication & session

**Status:** STUB  
**Spec:** `docs/VIBE_APP_SPECIFICATION.md` (auth sections)  
**Code:** `proxy.ts`, `lib/supabase/middleware.ts`, `app/auth/callback/route.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`  
**SQL:** `scripts/004_create_profiles.sql` (profile trigger)

## Invariants

- Session refresh runs in the request proxy (`proxy.ts` → `lib/supabase/middleware.ts`); no business rules there.  
- Callback must reject open redirects.  
- `profiles` created by DB trigger only.

## RLS

See spec §6 for `profiles` and related tables.
