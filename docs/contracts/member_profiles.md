# Contract: member profiles

**Status:** STUB  
**SQL:** `scripts/004_create_profiles.sql`  
**Code:** `app/(dashboard)/profile/**`, `components/dashboard/profile-form.tsx` (verify paths)

## Invariants

- Application code does not insert `profiles` on signup — trigger does.  
- Updates use Server Actions + RLS.
