# Contract: member follows

**Status:** MVP  
**SQL:** `supabase/migrations/20260611215000_member_follows.sql`  
**Code:** `app/actions/follows.ts`, `lib/follows/load-follows.ts`, `components/events/follow-organizer-button.tsx`

## Purpose

Members can follow organizers and categories to personalize discovery rails and recommendations.

## Storage

| Table | Purpose |
|-------|---------|
| `organization_follows` | `(user_id, org_id)` — follow an organizer |
| `member_category_follows` | `(user_id, category)` — follow a discovery category slug |

## RLS expectations

- Members can select/insert/delete only their own follow rows.
- No public read of other users' follows.

## UI surfaces

- **Follow organizer** on public event detail (`FollowOrganizerButton`).
- **From organizers you follow** rail on member dashboard.
- Recommendations scoring boosts followed orgs/categories in **`lib/events/member-recommendations.ts`**.

## Failure modes

| Symptom | First check |
|---------|-------------|
| Follow button no-ops | Migration applied; user signed in |
| Rail empty | No upcoming published events from followed orgs |
