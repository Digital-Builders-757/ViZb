# Domain contracts (Layer 2) — index

**Last updated:** March 23, 2026

Contracts define **invariants**, **owners** (routes + actions), **data touched**, **RLS expectations**, and **failure modes**. Until a contract is fully authored, **`docs/VIBE_APP_SPECIFICATION.md`** remains authoritative for schema and policies.

| Contract | File | Status |
|----------|------|--------|
| Auth & session | `auth.md` | Stub — expand from spec §7 + callback/middleware |
| Events | `events.md` | Stub — lifecycle, review, media |
| RSVPs & orders | `rsvps.md` | Roadmap — free RSVP + paid orders |
| Check-in | `checkins.md` | Roadmap — door / scanner |
| Member profiles | `member_profiles.md` | Stub — trigger, `profiles` table |
| Community posts / public feed posts | `community_posts.md` | MVP (Supabase schema + RLS required; see `docs/plans/POSTS_MVP.md`) |
| Venues | `venues.md` | Roadmap — may start as text fields on events |
| Notifications | `notifications.md` | Roadmap — email/push |
| Sponsors | `sponsors.md` | Roadmap |
| Media assets | `media_assets.md` | Stub — flyers bucket + upload actions |

## Authoring rules

1. Link new contracts here first.  
2. Update **`docs/DOCUMENTATION_INDEX.md`** if the contract introduces a new domain.  
3. Keep **`docs/EVENTS_SOURCE_OF_TRUTH.md`** and **`docs/COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md`** aligned when Layer 1 laws change.
