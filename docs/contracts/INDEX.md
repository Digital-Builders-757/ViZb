# Domain contracts (Layer 2) — index

**Last updated:** June 8, 2026

Contracts define **invariants**, **owners** (routes + actions), **data touched**, **RLS expectations**, and **failure modes**. Until a contract is fully authored, **`docs/VIBE_APP_SPECIFICATION.md`** remains authoritative for schema and policies.

| Contract | File | Status |
|----------|------|--------|
| Auth & session | `auth.md` | MVP — Supabase Auth, `proxy.ts`, `platform_role`, app gates |
| Events | `events.md` | MVP — lifecycle, discovery, official/community, trust signals, open mic |
| Event ingestion | `event-ingestion.md` | Foundation (#266) — candidates, adapters, import runs |
| RSVPs & orders | `rsvps.md` | MVP — free RSVP + `$0` tickets + Stripe paid checkout |
| Check-in | `checkins.md` | MVP — QR scan API + manual check-in/undo |
| Member profiles | `member_profiles.md` | MVP — trigger-created profiles, platform roles |
| Community posts / public feed posts | `community_posts.md` | MVP — public posts + staff CMS |
| Venues | `venues.md` | Roadmap — may start as text fields on events |
| Notifications | `notifications.md` | MVP — in-app dashboard notifications |
| Sponsors | `sponsors.md` | Roadmap |
| Media assets | `media_assets.md` | MVP — event flyers, post covers, post body images |

## Authoring rules

1. Link new contracts here first.  
2. Update **`docs/DOCUMENTATION_INDEX.md`** if the contract introduces a new domain.  
3. Keep **`docs/EVENTS_SOURCE_OF_TRUTH.md`** and **`docs/COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md`** aligned when Layer 1 laws change.
4. Prefer code and migrations over old prose when a contract drifts.
