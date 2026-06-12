# ViBE Events Platform -- MVP Status & Development Roadmap

> **What is ViBE?**
>
> An events discovery and ticketing platform targeting the Virginia/DMV creative community. Attendees browse events and buy tickets, organizers create events and check in guests at the door, and admins moderate the platform. Think Eventbrite with a streetwear editorial aesthetic.

---

## Current Status: MVP Shipped -- Paid Ticketing Live, Polish Ongoing

| Field | Value |
|-------|-------|
| **Last Audited** | June 12, 2026 |
| **Audited Environment** | production + develop branch (GitHub) |
| **Migrations Applied** | Verify per environment — canonical apply order: `docs/database/MIGRATIONS.md` (includes registrations, RSVP cap, tickets core, ticket-type editor, Stripe ticketing, posts MVP, archive RLS fix) |
| **Overall MVP Progress** | Phases 1–6 MVP shipped: auth, events + discovery, free RSVP + paid Stripe ticketing, door QR check-in, admin posts + ops tooling. Roadmap epic #113 (issues #114–#118) and Stripe ops batch #124–#131 closed June 2026. Remaining work is polish + ops hardening, not phase delivery. |
| **Security Audit** | 8/8 checks passed; see Security section + Known Issues |
| **Open Redirect Protection** | PASS -- `auth/callback` validates redirect targets against allowlist |
| **Subscribers Privacy** | PASS -- public SELECT disabled (migration 009); insert-only for waitlist |

> **"Passing" means:** Every migration executes cleanly, all RLS policies are verified, route protection has no redirect loops, and the auth callback rejects open-redirect payloads. Audit complete; controls verified; remaining work captured in roadmap + tech debt sections below.

### Migration Map (Quick Reference)

| Number | Script | Purpose |
|--------|--------|---------|
| 001 | `001_create_subscribers_table.sql` | Waitlist subscribers |
| 002 | `002_add_phone_number.sql` | Phone column on subscribers |
| 003 | `003_create_enums.sql` | 6 enum types |
| 004 | `004_create_profiles.sql` | Profiles + auto-create trigger |
| 005 | `005_create_organizations.sql` | Orgs + org members |
| 006 | `006_rls_security_fixes.sql` | RLS hardening (admin policies) |
| 007 | `007_column_privileges_hardening.sql` | Column-level privilege lock on `role_admin` |
| 008 | `008_fix_enum_values.sql` | Enum alignment (status + org_type values) |
| 009 | `009_fix_subscribers_rls.sql` | Subscribers privacy (admin-only read) |
| 010 | `010a_add_enum_values.sql` / `010b_invite_system.sql` / `010c_cleanup_old_policies.sql` | Platform role + org member roles + invite system |
| 011 | `011_invite_hardening.sql` | Invite/RLS hardening |
| 012 | `012_fix_org_members_recursion.sql` | RLS recursion fix |
| 013 | `013_create_events.sql` | Events + event_media + base RLS |
| 014 | `014_create_event_flyers_bucket.sql` | Storage bucket for event flyers |
| 015 | `015_fix_editor_update_policy.sql` | Editor policy fixes |
| 016 | `016_add_staff_events_update_policy.sql` | Staff/admin events update policy |
| 017 | `017_event_review_metadata.sql` | Review metadata fields |
| 018 | `018_guard_review_fields_trigger.sql` | Trigger guardrails for review fields |
| 019 | `019_staff_event_create_and_flyer_storage.sql` | Staff create + flyer storage behavior |
| 020 | `020_event_categories_array.sql` / `020_posts_mvp_platform_role.sql` | Categories array + Posts MVP (platform_role) |
| 021 | `021_seed_design_events.sql` | Seed data |
| 022 | `022_add_event_archived.sql` | Archived status for events (soft-delete) |
| 023 | `023_lock_archived_events.sql` | Lock archived events read-only for org members |
| 024 | `024_allow_staff_update_archived.sql` | Staff may update archived events (moderation / restore) |
| 025 | `025_create_event_registrations.sql` | `event_registrations` + RSVP policies |
| 026 | `026_event_rsvp_capacity.sql` / `20260410120000_event_rsvp_capacity.sql` | Optional `events.rsvp_capacity` + occupancy RPC |
| 028 | `028_tickets_core_free_rsvp.sql` / `20260410142142_tickets_core_free_rsvp.sql` | `ticket_types`, `orders`, `order_items`, `tickets`, mint RPC |
| 029 | `029_ticket_types_org_crud_and_mint_tier.sql` / `20260410144936_ticket_types_org_crud_and_mint_tier.sql` | Tier capacity / sale window; org CRUD; mint accepts tier id |
| — | `20260417202850_add_open_mic_event_category.sql` | Extends `events_categories_check` for tag **`open_mic`** |
| — | `20260417210000_event_lineup_entries.sql` | **`event_lineup_entries`** + **`lineup_entry_status`** + RLS (public read slice + org/staff CRUD) |
| — | `20260420231755_posts_content_image_urls.sql` | **`posts.content_image_urls`** gallery (≤6 images) |
| — | `20260505163945_add_event_kind_and_external_rsvp.sql` | **`events.event_kind`** (`official` / `community`) + **`external_rsvp_url`** for third-party listings |
| — | `20260505184652_event_staff_pick_and_listing_reports.sql` | **`events.is_staff_pick`** + **`event_listing_reports`** (listing moderation; RLS) |
| … | Other timestamped `supabase/migrations/*` | Full order + mirrors: `docs/database/MIGRATIONS.md` |

---

## Phase Completion Summary

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| Phase 1 | Auth + Dashboard Shell | COMPLETE | 100% |
| Phase 2 | Events + Media (Public Feed) | MVP shipped; ongoing polish | 90% |
| Phase 3 | Ticket Types + Free RSVP | MVP shipped — free RSVP, ticket wallet, tier CRUD, open-mic category | 90% |
| Phase 4 | Paid Tickets (Stripe Checkout) | MVP shipped — checkout + webhook mint; ops/env hardening remains | 80% |
| Phase 5 | Door Check-In | MVP shipped — QR scan API + manual check-in/undo | 75% |
| Phase 6 | Admin Workflows + Polish | MVP shipped; ongoing UX/ops polish | 80% |

### P0 / maintenance (no product phase change)

- **June 10, 2026 — Launch visual polish pass:** Public homepage, about, events, advertise, auth, nav/footer copy and glass/glow consistency; branded flyer fallbacks; unified `EmptyStateCard` + `NeonLink` CTAs. Follow-up on same branch: login/forgot-password/signup forms, global loading tagline, posts cards, app-preview. Audit: **`docs/design/LAUNCH_VISUAL_POLISH_AUDIT.md`**. Branch: `polish/launch-visual-pass`. No schema or flow changes.

- **April 18, 2026 — Code hygiene & documentation pass:** Layer 1 docs aligned with **Next.js 16 `proxy.ts`**, real **`app/actions/*`**, and **`createClient()`** naming; master log: **`docs/VIZB_CODE_HYGIENE_AND_DOCUMENTATION_MASTER_PLAN.md`** (includes validation checklist). Product behavior unchanged.
- **April 20, 2026 — Neon/glass UI batch (Phase 6 polish):** Public, auth, organizer, admin, and events/posts surfaces aligned with **`docs/VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md`**; integrated on **`develop`** via `feat/visual-overhaul-neon-glass`. `npm run ci` green before merge. **Also on this line:** admin **post cover** image upload (**`post-covers`** bucket, `supabase/migrations/20260420180000_post_covers_storage.sql`); organizer org home **Attendees** KPI counts **active RSVPs** (`event_registrations`, excl. cancelled) across the org’s events; marketing **home** navbar stays visible (no auto-hide on `/`); **events** timeline cards drop listing blurb (full copy remains on `/events/[slug]`).
- **April 20, 2026 — Admin posts UX + ViZb wordmark + Storage buckets:** Poster-friendly admin post labels (Caption, Post content); slug derived from title on create, unchanged on edit; canonical **`/vizb-logo.png`** wordmark (header, footer, auth, loading); migration **`supabase/migrations/20260420224705_storage_buckets_event_flyers_and_posts.sql`** ensures **`post-covers`**, **`event-flyers`**, and **`posts`** Storage buckets + RLS; clearer upload errors via **`lib/supabase/storage-errors.ts`**.
- **April 20, 2026 — Staff platform events:** **`/admin/events/new`** creates event drafts under the platform organization (default slug **`vizb`**, overridable via **`PLATFORM_ORG_SLUG`** in **`.env.example`**); **`lib/orgs/platform-org.ts`**; **`CreateEventForm`** supports **`flow="admin"`** (redirect to **`/admin/events/[id]`**); admin home quick links to **New platform event**.
- **April 20, 2026 — Post body gallery (up to 6 images):** Column **`posts.content_image_urls`** + Storage **`posts`** bucket paths; admin **Images in post** on **`/admin/posts/new`** and **`/admin/posts/[id]`**; public **`/p/[slug]`** shows **Photos** below the markdown body. Migration **`supabase/migrations/20260420231755_posts_content_image_urls.sql`**.
- **April 21, 2026 — Public events discovery polish:** Shared **`sliceCategoriesForDisplay`** + formatted labels; compact surfaces (landing, hero trending, `/events` trending) show at most one category + **`+N more`**; timeline cards keep two chips; flyer column no longer driven by tag stacks; **`tone="archive"`** for past-event grid; compact **My Vibes** on timeline flyers; dashboard agenda/day panel use **`DashboardCategoryChips`**. No schema changes.
- **April 21, 2026 — Readability polish (two passes):** Global tokens (**`--muted-foreground`**, **`--neon-text2`**, borders/inputs), **`text-readable-secondary`** for form/empty helpers, glass **inner highlight**, **`Input`/`Textarea`** lift; admin/organizer hex surfaces → theme utilities; **second pass:** brighter **`--neon-surface`** / **`--neon-hairline`**, public **`/events`** scrim + inactive chips, **`EventTimelineCard`** gradients + past grid opacity, **`/events/[slug]`** back link + flyer overlay, **`loading.tsx`** token colors, organizer/admin **no-flyer** icon contrast, **`event-card-list`** inactive tab affordance.
- **May 5, 2026 — Local / community events lane (Roadmap Runner Item 1):** **`events.event_kind`** + **`external_rsvp_url`** (**`supabase/migrations/20260505163945_add_event_kind_and_external_rsvp.sql`**). Staff create third-party listings from **`/admin/events/new/community`** under the platform org; public **`/events`** and **`/events/[slug]`** label them **`Local Event`** (not ViZb-hosted); primary RSVP opens **external URLs** in a **new tab** (`target="_blank"`, **`rel="noopener noreferrer"`**). Official ViZb events unchanged (flyer still required before review). Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **May 5, 2026 — Event discovery (Roadmap Runner Item 2):** Public **`/events`** gains **discovery** presets (**`discover`** query: tonight, weekend, free, family, after hours, open mic), **`q`** keyword search (title / venue / city / description / tags / org name), **`sort=city`** vs default soonest ordering, ticket-backed **free** heuristic + **Local & community** horizontal rail (**Starting soon** favours official ViZb events). Helpers: **`lib/events/discovery-filters.ts`**; **Family-friendly** maps to **workshop** + **social** until a dedicated tag exists. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **May 5, 2026 — Save, share, return (Roadmap Runner Item 3):** Public **`/events/[slug]`** stacks **My Vibes**, **`EventShareRow`** (copy link + **`navigator.share`** when available), and **`EventCalendarActions`** (Google Calendar + downloadable **.ics**); RSVP / paid **`TicketAddedSuccessDialog`** adds **View event**, **Open My Vibes**, share row, calendar, and My Vibes reminder copy; member dashboard **`MemberHomeQuickActions`** includes **My Vibes** (**`/dashboard#my-vibes-week-heading`**). Builds on existing **`event_saves`** / **My Vibes** (no parallel saved-feed product). Verified: **`npm run typecheck`**, **`npm run lint`**, **`npm run build`**.
- **May 5, 2026 — Attendance & door flow (Roadmap Runner Item 4):** Guests see **checked-in vs confirmed**, **capacity / almost-full** cues on **`EventRsvpCta`**, and **door** instructions on RSVP success + **`TicketWalletCard`**; organizers get a published-event **Door check-in** strip, **RSVP limit** progress (**`EventAttendeesPanel`**), attendee **status badges**, **manual check-in `router.refresh`**, **`/check-in`** **revalidation** from **`organizerCheckInRegistration`** / undo, and scanner UX (clear pasted code after admit, larger QR box). Verified: **`npm run typecheck`**, **`npm run lint`**, **`npm run build`**.
- **May 5, 2026 — Organizer power tools (Roadmap Runner Item 5):** **`duplicateOrganizerEventDraft`** (optional **none / +1 wk / +2 wk / +1 mo** date shift; copies tiers; **flyer omitted**) on **`OrganizerEventPowerToolsCard`** + staff **`/admin/events/[id]`**; **`EventPublicViewBeacon`** + **`POST /api/events/[slug]/view`** increment **`events.public_detail_view_count`** (migration **`20260505195500_event_public_detail_views.sql`**); create-event **speed tip**. Verified: **`npm run typecheck`**, **`npm run lint`**, **`npm run build`**.
- **May 5, 2026 — Trust + community signals (Roadmap Runner Item 6):** **`events.is_staff_pick`** (**Staff pick** badge + **`ViZb picks`** rail); **`event_listing_reports`** + public **Report listing** on **`/events/[slug]`**; staff queue **`/admin/event-listing-reports`**. Migration **`20260505184652_event_staff_pick_and_listing_reports.sql`**. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **May 5, 2026 — Growth + monetization (Roadmap Runner Item 7):** Inquiry-only **partnerships** lane: **`/advertise`** transparency (paid vs editorial); **`organizer_promotion`** interest type; **`OrganizerPartnershipUpsell`** on organizer home + published event pages; referrer lines via **`lib/partnerships/advertise-context.ts`**; **`docs/contracts/sponsors.md`**. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **May 26, 2026 — Community event flyer upload (admin create):** **`/admin/events/new/community`** optional inline flyer picker in **`CreateEventForm`** (two-step **`createEvent`** → **`uploadEventFlyer`**); upload failure redirects to **`/admin/events/[id]?flyer_upload=failed&reason=…`** with recovery banner; **`FlyerUploadForm`** on detail page remains replace/remove fallback. Flyer **optional for community review** (RSVP URL required); **recommended for feed visibility**. Official admin create unchanged. Docs: **`docs/work-orders/community-event-flyer-upload-work-order.md`**, **`docs/contracts/events.md`**. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **June 2, 2026 — Community event create 404 (production hotfix):** Production Supabase was missing **`20260505184652`** + **`20260505195500`** (applied via **`supabase db push`**); staff **Create Draft** on community listings no longer 404s on redirect to **`/admin/events/[id]`**. Code: admin detail shows explicit load error (schema-drift hint) instead of silent **`notFound()`**; **`/admin/events`** redirects to **`/admin#events`**. Docs: **`docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`**. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **June 2, 2026 — Events discovery rails redesign:** Public **`/events`** discovery rails get distinct layouts — **Starting soon** hero + sidebar (desktop) and snap-scroll (mobile); **Local & community** compact grid (desktop) / snap-scroll (mobile); **ViZb picks** snap-scroll on mobile. **`buildDiscoveryRails()`** in **`lib/events/discovery-rails.ts`** dedupes staff picks so editorial highlights appear only in **ViZb picks**. Redesign handoff docs + screenshot e2e script added. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **June 2, 2026 — Community event categories (create + admin edit):** Local/community create and edit now expose the same multi-select category picker as official events; **`createEvent`** / **`updateEventDetails`** no longer default missing tags to **`other`**. Shared **`EventCategoryPicker`**; admin list hints when only **Other** is set. Staff retag existing **`other`**-only published listings via **`/admin/events/[id]`** → **Event details**. No schema migration. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **June 2, 2026 — Homepage timeline-first MVP:** Public **`/`** is now intro + CTAs + **`HomeTimelineSection`** (**`EventTimelineCard`** preview, up to 12 events, My Vibes parity); hero tag pills and trending mini-grid removed; compact hero (no full-viewport lock). Editorial marquee, bento, stats, app preview, and waitlist moved to new **`/about`**; navbar adds **Home**, **About** → **`/about`**. Components: **`components/home-timeline-section.tsx`**, **`components/hero-photo-grid.tsx`**, **`app/about/page.tsx`**. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **June 7, 2026 — Admin posts workflow trust fix (#114):** Centralized **`createPost`** / **`updatePost`** in **`app/actions/posts-admin.ts`** with **`?error=`** redirects and **`revalidatePath`** on publish; edit page shows **Could not load post** card (schema drift / not found) instead of silent list bounce; success banners **`?created=1`**, **`?saved=1&status=`**; idempotent migration **`20260607193500_posts_mvp_base.sql`**. Docs: **`docs/contracts/community_posts.md`**, **`docs/journeys/admin_publishes_post.md`**, **`docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`**. Verified: **`npm run ci`**.
- **June 7, 2026 — ViBE discovery roadmap batch (#113–#118):** **`lib/log.ts`** scoped server logging + admin/load-error banners (**#118**); **`/events`** first-visit perf — static backdrop (no Three.js), query **`.limit(120)`**, non-interactive timeline cards (**#116**); post editor **Save draft / Publish** buttons + status badges on top of #114 actions (**#115**); **Local & community** rail + browse filter cleanup, rails visible when My Vibes signed-out (**#117**); docs: **`docs/OPERATIONS.md`**, **`docs/performance/README.md`**, journeys, contracts, troubleshooting. Issues **#113–#118** closed. Verified: **`npm run ci`** (149 tests).
- **June 7, 2026 — Events page scroll + neon polish:** Removed **Local & community** discovery rail from **`/events`** (community listings remain in **Full timeline** with **Local Event** badge). Added CSS-only **`.events-neon-card`** glow utilities on timeline + rail cards, stronger timeline spine, search CTA hover glow. **`buildDiscoveryRails()`** now returns **`{ trending, staffPicks }`** only. Verified: **`npm run typecheck`**, **`npm run test`** (148), **`npm run lint`**, **`npm run build`**.
- **June 8, 2026 — Documentation architecture rewrite:** Core docs spine hardened around **`docs/README.md`**, **`SYSTEM_DESIGN.md`**, **`ARCHITECTURE_OVERVIEW.md`**, **`DEVELOPER_GUIDE.md`**, **`REPO_MAP.md`**, **`OPERATIONS.md`**, and **`DECISIONS.md`**. Layer 2 contracts and Layer 3 journeys updated for shipped auth, events, RSVP/paid tickets, check-in, profiles, media, notifications, host/admin flows. Remaining cleanup is archival/brand/spec split, not current behavior discovery.
- **June 9, 2026 — Admin paid ticket tier UI (#124):** Staff can configure **Free RSVP only** or a single **Paid ticket** tier from **`/admin/events/new`** (official) and **`/admin/events/[id]`** via **`EventTicketingSection`** + **`upsertEventPaidTicketTier`**; **`createEvent`** seeds default RSVP + optional paid tier on create; **`lib/tickets/paid-tier-validation.ts`** enforces **$0.50** USD minimum. Unblocks end-to-end Stripe Checkout smoke without organizer dashboard. Verified: **`npm run typecheck`**, **`npm run test`** (162), **`npm run lint`**, **`npm run build`**.
- **June 9, 2026 — Paid checkout fulfillment sync (#129):** **`syncPaidTicketCheckoutSession`** + shared **`fulfillPaidCheckoutSession`** run on Stripe return (**`?session_id=`**) when webhooks are delayed or misconfigured on Vercel Preview; webhook handler refactored to same fulfillment path with clearer logging. Verified: **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`**.
- **June 10, 2026 — Stripe ticketing ops + door QR batch (#125–#128, #131):** Admin **`/admin/diagnostics/stripe`** readiness checks (env pass/fail, webhook URL); **`/admin/revenue`** paid-order ledger (ticket subtotal vs ViZb service fee); post-checkout banners + paid fulfillment dialog states; optional **`TICKET_PLATFORM_FEE_PERCENT`** / **`TICKET_PLATFORM_FEE_FIXED_CENTS`**; ticket detail door QR open by default (256px) + full backup code; regression tests for checkout guards, fees, fulfillment idempotency, QR/scan errors. Issues **#125**, **#126**, **#127**, **#128**, **#131** closed. Verified: **`npm run ci`** (179 tests).
- **June 10, 2026 — Homepage feed excludes archived events:** **`HomeTimelineSection`** uses **`lib/events/public-listing`** (published-only); mock timeline cards only when Supabase is not configured; archive/unarchive/review revalidate **`/`** via **`revalidatePublicEventDiscoveryPaths`**. Verified: **`npm run typecheck`**, **`npm run test`** (181), **`npm run lint`**, **`npm run build`**.
- **June 11, 2026 — Underwater visual system 2.0 (#163):** Canonical art direction + PR visual QA scorecard in **`docs/visual/VIZB_UNDERWATER_SYSTEM_2.md`** (token/primitive map, surface recipes, motion/media/perf rules). Docs-only.
- **June 11, 2026 — Activation funnel instrumentation (#153):** Product events via **`lib/analytics/product-events.ts`** + Vercel Analytics `track()` on event detail, save, RSVP/checkout, share, calendar, login redirect. Doc: **`docs/analytics/PRODUCT_EVENTS.md`**. Verified: **`npm run ci`** (207 tests).
- **June 11, 2026 — Post-login intent completion (#158):** Allowlisted **`save_event`** / **`rsvp_event`** intents on login redirect; **`PostLoginIntentResolver`** auto-saves My Vibes after sign-in and scrolls/focuses RSVP section. Helpers: **`lib/auth/post-login-intent.ts`**. Verified: **`npm run ci`** (202 tests).
- **June 11, 2026 — Admin dashboard user list UX (#178):** Full user directory moved to **`/admin/users`**; admin overview prioritizes content cards, stats, and review queues with a **5-user preview** + **Manage all users** link. Verified: **`npm run ci`**.
- **June 11, 2026 — Launch blockers (#173–#176):** Paid tier create syncs **`ticket_mode`** from admin create form state (**#175**); staff can replace flyers on **published** platform events via **`/admin/events/[id]`** (**#174**); staff door scanner at **`/admin/events/[id]/check-in`** reuses **`EventCheckInScanner`** + **`POST /api/checkin/scan`** (**#173**); regression tests for paid tier seeding, staff flyer replace, scan permissions, checkout fee env fallbacks (**#176**). Issues **#173–#176** closed. Verified: **`npm run ci`**.
- **June 11, 2026 — Member preference capture (#154):** **`member_preferences`** table + RLS (**`20260611201910_member_preferences.sql`**); first-run card on **`/dashboard`** and edit on **`/profile`** via **`MemberPreferencesForm`** + **`saveMemberPreferences`**. Helpers: **`lib/member/*`**. Verified: **`npm run ci`**.
- **June 11, 2026 — For You recommendations (#155):** **`lib/events/member-recommendations.ts`** scores upcoming events by preferences, saves, RSVPs, follows, and staff picks; dashboard **`ForYouRail`** + **`/events?discover=for-you`**. Verified: **`npm run ci`**.
- **June 11, 2026 — My Vibes in-app reminders (#156):** Hourly cron **`/api/cron/event-reminders`** + **`user_notifications.dedup_key`**; 24h/2h windows for saved/ticketed published events. Verified: **`npm run ci`**.
- **June 11, 2026 — Email event reminders (#157):** Resend mailer **`lib/email/event-reminder-mailer.ts`**; cron sends when **`email_reminders`** enabled; **`vercel.json`** hourly schedule. Verified: **`npm run ci`**.
- **June 11, 2026 — Post-event recap prompts (#159):** **`events.recap_post_id`** links published posts; staff links on **`/admin/events/[id]`**; recap surfaces on past event detail, ticket wallet, dashboard memory prompts. Verified: **`npm run ci`**.
- **June 11, 2026 — Organizer insights (#160):** **`OrganizerEventInsightsPanel`** with views, saves, RSVPs, conversion, check-in rate + tips; org members can read save counts via RLS. Verified: **`npm run ci`**.
- **June 11, 2026 — Follow organizer (#161):** **`organization_follows`** + **`member_category_follows`**; **`FollowOrganizerButton`**, dashboard **From organizers you follow** rail. Verified: **`npm run ci`**.
- **June 11, 2026 — Sentry production monitoring (#162):** **`@sentry/nextjs`** wired for Production/main only; shared gating in **`lib/sentry/common.ts`**; staff verification at **`/admin/diagnostics/sentry`**. Preview/develop intentionally unmonitored. Verified: **`npm run ci`** (229 tests).
- **June 11, 2026 — Ended events hidden from discovery (#181):** **`lib/events/event-schedule.ts`** centralizes **`coalesce(ends_at, starts_at)`** upcoming/past rules across Explore, homepage timeline, dashboard rails, event detail CTAs, RSVP/checkout server actions, and ticket wallet partitions. Verified: **`npm run ci`** (229 tests).
- **June 11, 2026 — Timeline CTA loop fix (#182):** Removed duplicate **Full timeline →** jump links from **`/events`** discovery rails; homepage keeps single **View full timeline →** entry. Verified: **`npm run ci`** (229 tests).
- **June 11, 2026 — Paid checkout fulfillment hardening (#180):** Return-path sync now confirms when fulfillment succeeds even if RPC omits ticket id; **`lookupTicketIdForOrder`** + **`healPaidTicketForEvent`** self-heal paid orders missing tickets (Preview webhook gaps). Verified: **`npm run ci`**.
- **June 11, 2026 — Door check-in QR UX (#183):** Upcoming tickets on **`/dashboard/tickets`** show QR expanded by default when **`TICKET_QR_SECRET`** is set; ops docs + **`.env.example`** clarify Preview/Production/local setup. Verified: **`npm run ci`**.
- **June 11, 2026 — Staff door scanner completion (#185):** **`/admin/check-in`** hub lists live events; scan API returns ticket fragment + event summary; **`EventCheckInScanner`** shows attendee/ticket/event result states, checked-in time, and **Scan next ticket**; regression tests for expired tokens and cancelled registrations. Verified: **`npm run ci`**.
- **June 11, 2026 — Events timeline cinematic pass (#186):** **`/events#timeline`** journey bridge, chapter-style date headers (sticky on mobile, pulse nodes), card entrance motion, staff-pick featured glow, and **`:target`** landing flash — filters/search/My Vibes unchanged. Verified: **`npm run ci`**.
- **June 11, 2026 — Admin recap link null guard:** **`linkEventRecapPost`** uses **`.maybeSingle()`** + explicit **Event not found** when the event id is missing (avoids null **`event.slug`** on revalidate). Verified: **`npm run typecheck`**, **`npm run test`** (236), **`npm run lint`**, **`npm run build`**.
- **June 11, 2026 — Paid tier on public event page (#189):** **`loadPublicTicketTiersForEvent`** falls back to legacy **`sales_starts_at`** columns when Stripe MVP columns are missing; **`force-dynamic`** on **`/events/[slug]`**; ticketing saves revalidate discovery paths. Verified: **`npm run ci`**.
- **June 11, 2026 — Onboarding preferences save (#192):** **`MemberPreferencesForm`** builds **`FormData`** from React state (avoids disabled-fieldset drops), clears validation on selection change, and **`router.refresh()`** after save so the first-run card hides once **`onboarding_completed_at`** is set. Verified: **`npm run typecheck`**, **`npm run test`** (240), **`npm run lint`**, **`npm run build`**.
- **June 11, 2026 — Homepage hero eyebrow polish (#191):** Tighter **`757 & DMV`** kicker spacing on **`components/hero-section.tsx`** (reduced tracking, normal ampersand). Verified: **`npm run typecheck`**, **`npm run lint`**, **`npm run build`**.
- **June 12, 2026 — Events discovery experience epic (#195–#201):** Ocean-themed **`EventsDiscoveryHero`**, **`EventsTideFilters`** (city + Paid preset), immersive **`EventTimelineCard`** actions (preview, calendar, price/ticket status), scroll **`EventsFeaturedMoment`** inserts, **`EventQuickPreviewPanel`** with scroll restore. Verified: **`npm run typecheck`**, **`npm run test`** (243), **`npm run lint`**, **`npm run build`**.
- **June 12, 2026 — Ticket history trust (#205):** **`/dashboard/tickets`** splits **Active tickets** vs **Ticket history**; past events show **Event ended** badge + muted styling; dashboard home CTA when only past tickets; tier name on wallet cards. Verified: **`npm run ci`** (255 tests).
- **June 12, 2026 — Ticket wallet pass UI (#206):** Pass-style **`TicketWalletCard`** (flyer header, perforated divider, high-contrast QR panel); **`getTicketDisplayState()`** helper + tests. Verified: **`npm run ci`**.
- **June 12, 2026 — Admin Stripe card reorder (#208):** Stripe ticketing diagnostics card moved to bottom of admin Content section (before Stats). Verified: **`npm run ci`**.
- **June 12, 2026 — Events filter simplification (#209):** **`EventsFilterSheet`** (When/Where/What/Price/Vibe); slim quick-filter row; hero filter dedupe; discovery rails hidden when city/discover/search active; deduped city labels. Verified: **`npm run ci`**.
- **June 12, 2026 — Posts UX polish (#207):** **`PostCard`** published dates + Event recap kicker; post detail author + linked event; admin form Content/Media/Publishing/Body sections; **`lib/posts/display.ts`**. Verified: **`npm run ci`**.
- **June 10, 2026 — Admin event archive actually hides listings:** **`archiveEvent`** / **`unarchiveEvent`** use service role + row-count verification; migration **`20260610043000_fix_event_archive_rls_with_check.sql`** fixes RLS **`WITH CHECK`** blocking **`status = archived`**; **`/events`** is **`force-dynamic`** with published-only defense filter. Re-archive events that were “archived” before this fix. Verified: **`npm run typecheck`**, **`npm run test`** (181), **`npm run lint`**, **`npm run build`**.

---

## What Exists Today (Verified Against Codebase)

### Landing Page (Pre-Phase 1 -- Live)

- **Timeline-first homepage** at **`/`**: compact hero (Virginia Isn't Boring + CTAs), **`HomeTimelineSection`** (**`EventTimelineCard`** scroll, link to **`/events#timeline`**), footer — marquee / editorial / waitlist live on **`/about`**
- **Ocean impression packs** (see `docs/IMPRESSION_PACKS.md`): Pack 01 ships **ocean section dividers** (`OceanDivider` + tokens in `app/globals.css`). Pack 02 adds optional **`GlassCard` `interactive`** mode (subtle tilt + specular glare, reduced-motion safe) on **event timeline** cards (`/events`) and **latest post** cards on the homepage. Pack 03 adds **`.vibe-focus-ring`** (keyboard-only branded outline + shared glow tokens for `.vibe-input-glass`) on **NeonButton**, **NeonLink**, login/signup, waitlist, **events** filter chips, and **`/advertise`** form controls.
- Global first-load screen (`app/loading.tsx`) uses CSS-only **WaterLoader**; hero, editorial grid, and events preview images use **WaterFrame** (liquid neon edge + inset hover glow; tokens `--water-a` / `--water-b` in `app/globals.css`)
- 3D Three.js animated background (client-side); homepage uses **`AppShell` + neon dashboard backdrop** for parity with `/advertise` and signed-in shells (marketing polish)
- Waitlist subscription via `subscribers` table (scripts 001-002)
- ViBE brand system fully implemented: dark mode, zero radius, Space Grotesk + Playfair Display + JetBrains Mono typography
- Responsive navbar with mobile toggle
- **Partnerships:** **`/advertise`** — “Advertise with ViZb” lead form; public **single-column** page uses the same **`AppShell` + neon backdrop** language as the dashboard (`GlassCard` form, **`WaterFrame`** hero, **`neon-gradient-text`** H1) without the signed-in sidebar. Submissions email **`admin@thevavibe.com`** by default via **Resend** (see **`.env.example`**: `RESEND_API_KEY`, `ADMIN_EMAIL`, `RESEND_FROM`)

### Database (60+ Migrations Executed)

> The repo ships **60+ migrations** under `supabase/migrations/` (timestamped) plus legacy numbered `scripts/0xx_*.sql` mirrors. Canonical apply order: **`docs/database/MIGRATIONS.md`**. The table below covers only the original Phase 1 foundation batch.

| Script | Contents | Status |
|--------|----------|--------|
| `001_create_subscribers_table.sql` | Waitlist `subscribers` table | Executed |
| `002_add_phone_number.sql` | Phone column on subscribers | Executed |
| `003_create_enums.sql` | 6 enum types: `org_type`, `org_status`, `org_member_role`, `event_status`, `order_status`, `media_kind` | Executed |
| `004_create_profiles.sql` | `profiles` table + `handle_new_user` trigger + RLS | Executed |
| `005_create_organizations.sql` | `organizations` + `organization_members` tables + RLS | Executed |
| `006_rls_security_fixes.sql` | 4 RLS patches (admin self-promotion block, admin read policies) | Executed |
| `007_column_privileges_hardening.sql` | Column-level UPDATE privileges on profiles (blocks `role_admin` writes at Postgres level) | Executed |
| `008_fix_enum_values.sql` | Adds missing enum values: `pending_review` to org/event status, `collective`/`brand`/`nonprofit`/`independent` to org_type, `rejected` to event_status | Executed |
| `009_fix_subscribers_rls.sql` | Locks down subscribers table: replaces public SELECT with admin-only read | Executed |

**Tables that exist (now):** `subscribers`, `profiles`, `organizations`, `organization_members`, `events`, `event_media`, `posts`, `event_registrations`, `ticket_types`, `orders`, `order_items`, `tickets` (plus saves/notifications per your env — confirm with `docs/database/MIGRATIONS.md`)

**Still outstanding for Phase 4+:** Stripe Tax / partial refunds automation; Connect payouts; dedicated door UI polish (Phase 5)

**Shipped (Phase 4 slice — April/June 2026):** `createTicketCheckoutSession` (`app/actions/ticket-checkout.ts`), `POST /api/stripe/webhook` (returns **500/503** on fulfillment / config failure so Stripe retries; **200** only on success or benign skips), current `fulfill_stripe_ticket_order` RPC (`supabase/migrations/20260606000500_stripe_ticketing_mvp_upgrade.sql`; supersedes older `fulfill_stripe_checkout_for_ticket`), paid tier pricing in organizer panel, public **Buy ticket** on `/events/[slug]`. **Admin paid tier create/edit** on official platform events (**#124**). **Return-path fulfillment sync** on **`?session_id=`** for Preview/webhook gaps (**#129**). **Stripe readiness diagnostics** (**`/admin/diagnostics/stripe`**, **#125**), **ticket revenue admin view** (**`/admin/revenue`**, **#126**), post-checkout UX (**#127**), checkout regression tests (**#128**), door QR on ticket detail (**#131**). **P0 next:** staging/prod checkout smoke test + watch Stripe webhook deliveries after deploy.

**DB hygiene (April 2026):** Migration `20260410120500_enable_pgcrypto.sql` ensures `pgcrypto`; ticket SQL uses `extensions.gen_random_bytes(8)` so `supabase db push` works when `search_path` omits `extensions`. Out-of-order remote history: `supabase db push --include-all`.

### Authentication System (Phase 1 -- Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Email + password sign-up | `app/signup/page.tsx` | DONE -- passes display_name via metadata, sends confirmation email |
| Email + password sign-in | `app/login/page.tsx` | DONE -- client form with error handling, redirect support |
| Email confirmation callback | `app/auth/callback/route.ts` | DONE -- exchanges code for session, redirects to dashboard |
| Sign-up success page | `app/auth/sign-up-success/page.tsx` | DONE -- "Check your inbox" branded page |
| Auth error page | `app/auth/error/page.tsx` | DONE -- generic error with link back to login |
| Session refresh middleware | `lib/supabase/middleware.ts` | DONE -- follows Supabase SSR reference pattern |
| Route protection | `proxy.ts` | DONE -- protects `/dashboard`, `/organizer`, `/admin`, `/tickets`, `/profile`; redirects logged-in users away from `/login` and `/signup` |
| Auth helpers | `lib/auth-helpers.ts` | DONE -- `requireAuth()`, `getProfile()`, `requireAdmin()`, `requireOrgMember()`, `getUserOrganizations()` |
| Profile auto-creation | `scripts/004_create_profiles.sql` trigger | DONE -- `handle_new_user()` creates profile row on signup |
| Sign out | `components/dashboard/sidebar.tsx` | DONE -- client-side sign out with redirect |

### Dashboard Shell (Phase 1 -- Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Dashboard layout | `app/(dashboard)/layout.tsx` | DONE -- server component fetches profile + orgs, renders sidebar |
| Sidebar navigation | `components/dashboard/sidebar.tsx` | DONE -- personal links, org links (dynamic), admin link (conditional) |
| Attendee home page | `app/(dashboard)/dashboard/page.tsx` | DONE -- welcome, stats (0s), first-run prompt, create org CTA, tickets empty state |
| Member planner calendar | `components/dashboard/calendar/*` | Month / Week / Agenda + Eastern dates; day + event selection; detail panel (desktop) / Sheet (mobile); ICS via `app/api/calendar/ics`; org “Hosted by”; query still `getPublishedEventsForDashboardMonth` (widened window). Re-export: `dashboard-month-calendar.tsx` → shell. |
| My Tickets / wallet | `app/(dashboard)/dashboard/tickets/page.tsx`, `app/(dashboard)/tickets/*` (canonical **`/tickets`**), `components/dashboard/tickets/*` | DONE (v1) -- tickets from `tickets` + registration embed; **`/dashboard/tickets`** remains an alias. Calendar actions, **Add to Apple Wallet / Add to Google Wallet** when env is configured (see `docs/operations/WALLET_PASSES_SETUP.md`). APIs: `GET /api/tickets/pass/apple`, `GET /api/tickets/pass/google`. |
| Profile page | `app/(dashboard)/profile/page.tsx` | DONE -- display name edit form with server-side save |
| Profile form component | `components/dashboard/profile-form.tsx` | DONE -- client form with success/error states |

### Organizer System (Phase 1 -- Shell Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Create organization form | `app/(dashboard)/organizer/new/page.tsx` | DONE -- name, auto-slug, type dropdown, description |
| Create organization action | `app/actions/organization.ts` | DONE -- validates inputs, checks slug uniqueness, inserts org + owner membership |
| Org dashboard (per-org) | `app/(dashboard)/organizer/[slug]/page.tsx` | DONE -- pending review notice, stats (0s), events empty state, create event CTA |
| Org membership check | `lib/auth-helpers.ts` `requireOrgMember()` | DONE -- verifies org exists + user is member, redirects otherwise |

### Admin System (Phase 1 -- Placeholder Complete)

| Feature | File(s) | Status |
|---------|---------|--------|
| Admin gate | `lib/auth-helpers.ts` `requireAdmin()` | DONE -- checks `role_admin`, redirects non-admins to `/dashboard` |
| Admin overview page | `app/(dashboard)/admin/page.tsx` | DONE -- live counts (users, orgs, pending orgs), placeholder approval queue |
| Delete users (staff) | `app/actions/admin-users.ts`, `components/admin/users-table.tsx`, `lib/supabase/service-role.ts`, migration `20260410200000_auth_user_delete_foreign_keys.sql` | DONE -- `auth.admin.deleteUser` with server-only `SUPABASE_SERVICE_ROLE_KEY`; cannot delete self or `staff_admin`; migration relaxes FKs so `auth.users` deletion succeeds |

### Known Deviations from Architecture Laws

| Deviation | Law Violated | Risk Level | Mitigation |
|-----------|-------------|------------|------------|
| Profile form (`profile-form.tsx`) writes directly via client Supabase instead of server action | Rule 2: mutations in server actions | Low | RLS + column-level privileges prevent escalation; only `display_name`, `avatar_url`, `updated_at` are writable. Fix planned for Phase 1.1 polish. |

### Security (Phase 1 -- Hardened)

| Check | Status | Details |
|-------|--------|---------|
| RLS on all tables | PASS | profiles, organizations, organization_members, subscribers all have RLS enabled with policies |
| Admin self-promotion blocked | PASS | `WITH CHECK` on profiles update prevents changing `role_admin` + column-level REVOKE (migration 007) |
| Admin read access | PASS | Admins can read all orgs and members via dedicated policies |
| Admin org updates | PASS | Admins can update orgs for future approval workflows |
| Column name consistency | PASS | All code uses `org_id` (not `organization_id`) matching actual schema |
| No service-role key in client | PASS | Admin page uses normal anon client, relies on RLS |
| Session refresh | PASS | Middleware calls `getUser()` on every request per Supabase SSR pattern |
| No redirect loops | PASS | Public routes excluded from protection, auth pages redirect logged-in users |
| Open redirect protection | PASS | `auth/callback` validates redirect param: relative paths only, allowlisted prefixes, blocks `//` and encoded schemes |
| Subscribers privacy | PASS | Public SELECT disabled (migration 009); only admins can read waitlist emails; public can only insert |
| Enum value consistency | PASS | All enum values match between DB and app code (migration 008 added missing values) |

#### Verification Steps for Critical Fixes

Each critical fix should be verified with these concrete steps. Run after any migration batch.

| Fix | How to Verify | Expected Result | Evidence |
|-----|--------------|-----------------|----------|
| Role escalation hard-lock (007) | Authenticated user calls `supabase.from('profiles').update({ role_admin: true }).eq('id', uid)` | Postgres error: permission denied for column `role_admin` | Network tab shows 403 / error response with `permission denied` |
| Admin read policies (006) | Admin user calls `supabase.from('organizations').select('*').eq('status', 'pending_review')` | Returns all pending orgs. Same query from non-admin returns empty. | Compare response arrays: admin gets rows, non-admin gets `[]` |
| Open redirect protection | Navigate to `/auth/callback?code=valid&redirect=https://evil.com` | Redirects to `/dashboard`, not to external URL | Browser URL bar shows `/dashboard`; no external navigation |
| Open redirect protocol-relative | Navigate to `/auth/callback?code=valid&redirect=//evil.com` | Redirects to `/dashboard`, not to external URL | Browser URL bar shows `/dashboard`; no external navigation |
| Subscribers privacy (009) | Unauthenticated call to `supabase.from('subscribers').select('*')` | Returns empty array (RLS blocks read) | Response body: `{ "data": [], "error": null }` |
| Enum consistency (008) | `INSERT INTO organizations (name, slug, type) VALUES ('Test', 'test', 'collective')` | Succeeds (previously would fail with invalid enum value) | Row appears in `organizations` table; clean up test row after |
| Enum consistency (008) | `INSERT INTO organizations (name, slug, status) VALUES ('Test', 'test2', 'pending_review')` | Succeeds (previously would fail with invalid enum value) | Row appears in `organizations` table; clean up test row after |

#### Post-Migration Regression Checklist

Run this checklist after applying any batch of migrations to confirm no regressions.

**Environment:**
- **Where to run:** v0 preview URL (dev) or `localhost:3000` if running locally
- **Test accounts needed:**
  - Normal user: any fresh signup (e.g., `testuser@example.com`)
  - Admin user: a user whose `profiles.role_admin` has been set to `true` via SQL (`UPDATE profiles SET role_admin = true WHERE id = '<uid>'`)
- **Browser:** Desktop Chrome (mobile dashboard is a known limitation until Phase 6)

**Steps:**

- [ ] **Sign up** -- Create new account with email + password. Confirmation email sends. Profile row auto-created via trigger.
- [ ] **Email confirm + redirect** -- Click confirmation link. Lands on `/dashboard` (not `/login`, not external URL).
- [ ] **Login** -- Sign in with confirmed credentials. Session persists across hard refresh.
- [ ] **Profile edit** -- Change display name on `/profile`. Save succeeds. `role_admin` field NOT writable (verify via dev tools network tab).
- [ ] **Create org** -- Submit org creation form. Org appears in sidebar. Slug collision returns clean error on retry with same name.
- [ ] **Org dashboard** -- Navigate to `/organizer/[slug]`. Shows pending review notice. Non-member redirected to `/dashboard`.
- [ ] **Admin page** -- Admin user sees real counts at `/admin`. Non-admin user redirected to `/dashboard`.
- [ ] **Sidebar nav** -- All sidebar links resolve correctly. Org list updates after org creation. Admin link only visible to admins.
- [ ] **Sign out** -- Click sign out. Redirected to `/`. Protected routes redirect back to `/login`.

**Expected known failures (not regressions):**
- Mobile dashboard navigation does not work (sidebar is desktop-only, fixed `w-64`). This is tracked in tech debt for Phase 6.
- No loading skeletons -- pages may flash while server components load. Tracked for Phase 6.
- Wallet pass issuance requires operator setup (Apple Pass Type ID + Google issuer); without env, dashboard explains that passes are not enabled (no teaser copy).

> **Note:** This manual checklist still covers full product flows. **GitHub PR CI** (`.github/workflows/pr-ci.yml`) runs Vitest, lint, build, and **Playwright** auth UX tests (`tests/e2e/auth-errors.spec.ts`, mocked Supabase). Keep running this checklist after migration batches either way.

### Documentation (Layer 1 Complete; Layers 2-3 Pending)

| Document | Purpose | Status |
|----------|---------|--------|
| `VIBE_APP_SPECIFICATION.md` | Full MVP tech spec (schema, auth, payments, routes, roadmap) | DONE -- 1135 lines |
| `BRAND_SYSTEM.md` | Canonical visual identity with anti-patterns | DONE |
| `ARCHITECTURE_SOURCE_OF_TRUTH.md` | Module ownership, wiring laws, drift prevention | DONE |
| `CODING_STANDARDS.md` | Code style, patterns, conventions | DONE |
| `DOCUMENTATION_INDEX.md` | 3-layer documentation spine | DONE |
| `DEVELOPER_ONBOARDING.md` | Quick-start guide for developers/AI agents | DONE |
| `archive/PROJECT_PLAN_PHASE1.md` | Phase 1 implementation plan with security audit results | DONE (archived June 2026) |

---

## What does not exist yet (snapshot)

> **Note:** The tables below used to mirror an older file plan (`010_create_events.sql`, `011_create_tickets.sql`). The repo now ships **`013_create_events.sql`** + later numbered scripts and timestamped **`supabase/migrations/*`**. Treat **`docs/database/MIGRATIONS.md`** + **`database_schema_audit.md`** as the apply checklist.

### Database gaps (Phase 4+)

| Gap | Phase | Notes |
|-----|-------|--------|
| Stripe Tax / amount_total vs list price | 4 | Fulfillment RPC expects **no tax** (or match `amount_total` to tier); adjust when enabling Stripe Tax |
| Organizer **paid** tier editor | 4 | **Shipped:** USD price on create/update; price locked after first issued ticket |

### Features not yet built (selected)

| Feature | Route / area | Phase |
|---------|----------------|-------|
| Stripe Checkout + webhook | `app/actions/ticket-checkout.ts`, `/api/stripe/webhook` | 4 — **shipped** (June 2026; remaining: Stripe Tax, Connect payouts, refunds automation) |
| Dedicated door / scanner screen | `/organizer/.../door` (planned path) | 5 |
| Live Realtime check-in counters | organizer UI | 5 |
| Admin org approval queue polish | `/admin/orgs` | 6 |
| Platform metrics dashboard (enhanced) | `/admin` | 6 |
| Mobile-first sidebar parity | `components/dashboard/sidebar.tsx` | 6 |

### Integrations

| Integration | Purpose | Status |
|-------------|---------|--------|
| Stripe | Paid ticket purchases | **LIVE** — checkout, webhook fulfillment, return-path sync, `/admin/diagnostics/stripe` readiness checks, `/admin/revenue` ledger (June 2026) |
| Resend | Advertise inquiry email | Configured via env (`RESEND_API_KEY`) |
| Supabase Realtime (optional) | Live check-in counters | Not configured (Phase 5 backlog) |
| Sentry | Error monitoring | Not wired — env placeholders only; logging is stdout via `lib/log.ts` (see `docs/OPERATIONS.md`) |

---

## Implementation Roadmap (Phases 2-6)

### Phase 2: Events + Media (Public Feed)

**Goal:** Organizers can create events with flyers. The public can browse published events.

**Database work:**
- [ ] Write `scripts/010_create_events.sql` -- `events` table, `event_media` table, indexes, RLS policies
- [ ] Create Supabase Storage bucket: `event-flyers` (with MIME/size policies)
- [ ] Add storage policies for bucket access control

**Server actions:**
- [ ] `app/actions/events.ts` -- `createEvent()`, `updateEvent()`, `submitEventForReview()`
- [ ] `app/actions/admin.ts` -- `publishEvent()`, `rejectEvent()`

**Pages:**
- [ ] `/events` -- public event feed with flyer-first grid, filterable by city/date/category
- [ ] `/events/[id]` -- event detail page with flyer hero, description, ticket info, RSVP/buy buttons
- [ ] `/organizer/[slug]/events/new` -- event creation form with flyer upload, date/time picker, location fields
- [ ] `/organizer/[slug]/events/[id]` -- event edit page
- [ ] `/admin/events` -- event approval queue (pending events list with approve/reject actions)

**Components:**
- [ ] `components/events/event-card.tsx` -- flyer-first card for the event grid
- [ ] `components/events/event-form.tsx` -- shared form for create/edit
- [ ] `components/events/flyer-upload.tsx` -- image upload to Supabase Storage
- [ ] `components/events/event-filters.tsx` -- city, date, category filter bar

**Key decisions:**
- Events start as `draft`, organizer submits for review (`pending_review`), admin publishes (`published`) or rejects (`rejected`)
- **Any org can create events** regardless of org status. The gate is on the *event*, not the org. Admin publishes events, not orgs. (Org approval is Phase 6 polish.)
- Flyer is required -- events are flyer-first
- Location is text-based (no map integration for MVP)
- Categories: party, workshop, networking, social (enum)

**Storage policy spec:**

| Setting | Value |
|---------|-------|
| Buckets created | `event-flyers` (defer `event-gallery`, `avatars`, `org-logos` to later phases) |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Max file size | 5 MB |
| Access model | Flyers are **public read** after event publish; signed URLs during `draft`/`pending_review` |
| Who can upload/replace | Org members (owner, manager, staff) for their own org's events |
| Who can delete | Org owners + admins |

**Acceptance criteria:**
- [ ] An organizer with *any* org can create an event with a flyer and submit it for review
- [ ] An admin can see `pending_review` events and publish or reject them
- [ ] Published events appear in the public feed at `/events`
- [ ] Events are filterable by city and category
- [ ] Event detail page shows flyer, description, date/time, location
- [ ] Flyer upload enforces MIME type and size limits

---

### Phase 3: Ticket Types + Free RSVP

**Goal:** Events have ticket tiers. Attendees can RSVP to free events and receive tickets.

**Shipped (April 2026 — Open mic lineup v1):**

- [x] **`event_lineup_entries`** + RLS — `supabase/migrations/20260417210000_event_lineup_entries.sql`; dashboard **`OpenMicLineupPanel`** (`components/organizer/open-mic-lineup-panel.tsx`) on organizer + admin event pages when **`open_mic`** is in categories; public **`/lineup/[eventSlug]`** (`app/lineup/[eventSlug]/page.tsx`) with strict query filters; mutations **`app/actions/lineup.ts`**
- [x] **Public lineup share URL** — `lib/public-site-url.ts` (absolute link from **`NEXT_PUBLIC_SITE_URL`**); organizer panel shows the URL + **Copy public link**; **`docs/OPEN_MIC_LINEUP.md`** + **`.env.example`** document canonical host (e.g. `www` after apex redirect)
- [x] **Organizer lineup visibility UX (April 2026)** — `OpenMicLineupPanel` explains public rules (public + confirmed/performed), per-row public state, empty-eligible callout, draft-event note, open/copy public URL; **`lib/lineup/lineup-entry-status.ts`** helpers mirror public filters; quick-add defaults to **confirmed** in **`app/actions/lineup.ts`**
- [x] **Public lineup page visuals** — **`/lineup/[eventSlug]`** uses the same immersive stack as **`/events`** (`ThreeBackgroundWrapper`, overlay, neon orbs), **`OceanDivider`** rhythm, **`headline-xl`** hero, **`GlassCard` emphasis** + **`WaterFrame`** performer block, **`NeonLink`** CTAs; **`max-w-[1200px]`** layout

**Shipped (April 2026 — Tickets / wallet passes v2):**

- [x] HMAC-signed barcode payload (no PII) — `lib/tickets/barcode-token.ts`
- [x] Apple Wallet `.pkpass` route (Node + `passkit-generator`) — `app/api/tickets/pass/apple/route.ts`
- [x] Google Wallet “save” redirect + `format=json` — `app/api/tickets/pass/google/route.ts`
- [x] Dashboard wallet buttons — `components/dashboard/tickets/ticket-wallet-actions.tsx`
- [x] **Attendee UX (April 2026)** — RSVP + paid checkout land in **My Tickets**: success dialog (`components/events/ticket-added-success-dialog.tsx`) with calendar actions; `rsvpToEvent` returns minted `ticketId`; Stripe return shares the same dialog; wallet list / member home copy clarifies destination and constraints; wallet cards use honest check-in QR + wallet-pass unavailable messaging
- [x] Operator doc — `docs/operations/WALLET_PASSES_SETUP.md`
- [x] **Optional RSVP capacity** — `events.rsvp_capacity`, DB trigger + `published_event_rsvp_occupied_count` RPC (`supabase/migrations/20260410120000_event_rsvp_capacity.sql`, `scripts/026_event_rsvp_capacity.sql`); organizer create/edit forms; public `/events/[slug]` CTA shows fill level and blocks RSVP when full; unlimited vs capped UX on create/edit; org **editors** can update event details (same as create permission); **admin** event detail page reuses the organizer details editor for urgent fixes
- [x] **Organizer event edit — save scopes (April 2026)** — Event details before RSVP/ticket tiers; **Save event details** is the primary CTA (sticky bar, high-contrast, full-width on mobile, unsaved hint when dirty); **Save tier** / **Add tier** stay visually secondary; sonner **Event details saved**; microcopy for whole-event cap vs tiers; `EventDetailsEditForm` remount via `updated_at` on organizer + admin pages. If category saves fail with **`events_categories_check`**, confirm migration **`20260417202850`** on the Supabase project matching app env (`docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`).
- [x] **Free RSVP → \$0 ticket model** — `ticket_types` (default RSVP tier per event), `orders`, `order_items`, `tickets` + `mint_free_rsvp_ticket_for_registration` (`supabase/migrations/20260410142142_tickets_core_free_rsvp.sql`, `scripts/028_tickets_core_free_rsvp.sql`); RSVP action mints ticket after `event_registrations` upsert; dashboard **`/dashboard/tickets`** lists tickets (upcoming / past); **`/dashboard/tickets/[ticketId]`** full ticket view with code; door QR still uses registration id (`rid`) for compatibility

**P0 next:** Harden paid flow (Stripe Tax, refund hooks, monitoring) + revenue reporting. **P1:** *(shipped)* Canonical wallet **`/tickets`**; *(shipped)* Stripe Checkout + webhook mint + paid tier editor (requires env + migration **`030`**).

**Shipped (ticket tiers v1):** Organizer **Free RSVP tiers** UI on organizer event page; optional per-tier capacity + sale window; public event page tier **chooser** when multiple free tiers are on sale; mint RPC accepts optional tier id.

**Database work:**
- [x] `ticket_types`, `orders`, `order_items`, `tickets` + RLS + mint RPC — `028_tickets_core_free_rsvp.sql` / migration `20260410142142_tickets_core_free_rsvp.sql`

**Server actions:**
- [x] Mint after RSVP — `mint_free_rsvp_ticket_for_registration` invoked from `app/actions/registrations.ts` (replaces separate `createFreeRSVP` action for v1)

**Pages:**
- [x] **`/events/[slug]`** — free tier selector when multiple $0 tiers on sale; single tier shows label
- [x] **`/tickets`** and **`/tickets/[ticketId]`** — canonical wallet paths (shared implementation with dashboard alias)
- [x] **`/dashboard/tickets`** — same list/detail as **`/tickets`** (deep links and bookmarks still work)
- [x] Organizer event page — **ticket type panel** (free tiers: name, sort, capacity, sale window; seed default `RSVP` row when none)

**Components (as implemented in repo):**
- [x] Wallet list card — `components/dashboard/tickets/ticket-wallet-card.tsx`
- [x] Wallet detail — `components/dashboard/tickets/ticket-wallet-detail-view.tsx`
- [x] RSVP + tier UX — `components/events/event-rsvp-cta.tsx` (quantity = 1 for free v1)

**Key decisions:**
- Free RSVPs are `$0` tickets -- one unified model for all door-check scenarios
- `ticket_code` is a unique 16-char hex string (QR payload for v2)
- `checked_in_at` being non-null = attendee was checked in

**Acceptance criteria:**
- [x] An organizer can add **free** ticket types (name, sort, capacity, sale window) to their event
- [x] An organizer can add **paid** ticket types (USD) and attendees can check out with Stripe when env + webhook + DB **`030`** are applied
- [x] An attendee can RSVP to a free event and receive a ticket instantly
- [x] Tickets appear in the attendee's wallet at `/tickets`
- [x] Each ticket shows a unique ticket code
- [x] RSVP / tier capacity is enforced (RSVP fails when whole-event or tier cap is full)

---

### Phase 4: Paid Tickets (Stripe Checkout)

**Goal:** Attendees can purchase paid tickets via Stripe Checkout.

**Integration setup:**
- [x] Stripe env vars documented (`.env.example`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`

**API routes / actions:**
- [x] `app/actions/ticket-checkout.ts` — `createTicketCheckoutSession` (server action creates Checkout Session)
- [x] `app/api/stripe/webhook/route.ts` — `checkout.session.completed` → `fulfill_stripe_ticket_order` (service role)

**Page enhancements:**
- [x] `/events/[slug]` — paid tier picker + **Buy ticket**; return handling via `EventStripeReturn`
- [ ] Optional dedicated `/checkout/success` page (currently query param + toast)

**Key decisions:**
- Stripe Checkout (hosted page) -- no custom payment forms
- Orders start as `pending`, webhook confirms `paid`
- Never trust client redirect as confirmation -- only webhook is authoritative
- All sales run through ViBE's own Stripe account for MVP (manual payouts to organizers)

**Acceptance criteria:**
- [x] An attendee can select a paid ticket type and complete checkout via Stripe
- [x] After payment, the webhook mints tickets and updates order status (plus return-path sync `syncPaidTicketCheckoutSession` for Preview/webhook gaps, #129)
- [x] Tickets appear in the attendee's wallet after purchase
- [x] Failed/cancelled payments do not create tickets (regression tests, #128)
- [x] Webhook signature verification is enforced

---

### Phase 5: Door Check-In

**Goal:** Organizers can check in attendees at the door on event day.

**Pages:**
- [ ] `/organizer/[slug]/events/[id]/door` -- door check-in screen with attendee list and check-in toggle

**Components:**
- [ ] `components/organizer/door-screen.tsx` -- attendee list with search, check-in button per ticket
- [ ] `components/organizer/checkin-counter.tsx` -- live count of checked-in vs. total

**Server actions:**
- [ ] `app/actions/tickets.ts` -- `checkInTicket()` (sets `checked_in_at` timestamp)

**Optional (nice-to-have):**
- [ ] Supabase Realtime subscription for live check-in counter updates
- [ ] Ticket search by name or ticket code

**Key decisions:**
- Manual tap check-in (no QR scanning for MVP)
- Check-in sets `checked_in_at = now()` -- idempotent (tapping twice is a no-op)
- Requires active internet connection

**Acceptance criteria:**
- [ ] An organizer can open the door screen for their event
- [ ] The attendee list shows all ticket holders with check-in status
- [ ] Tapping "Check In" marks the ticket and updates the counter
- [ ] Only org members can access the door screen (RLS + auth helper)

---

### Phase 6: Admin Workflows + Polish

**Goal:** Full admin dashboard, organization approval queue, user moderation, platform metrics. Responsive polish.

**Pages:**
- [ ] `/admin/orgs` -- organization approval queue (pending list, approve/reject with notes)
- [ ] `/admin/users` -- user management table (search, view profiles, moderate) *(partial: delete non-staff users from **All Users** on `/admin`)* 
- [ ] Enhance `/admin` -- real metrics dashboard (total users, events, tickets sold, revenue)
- [ ] `/admin/events` -- enhanced event management (beyond just approval)

**Server actions:**
- [ ] `app/actions/admin.ts` -- `approveOrganization()`, `suspendOrganization()`, `moderateUser()`

**Polish:**
- [ ] Mobile-responsive sidebar (sheet/drawer on mobile, collapse on tablet)
- [ ] Loading states (skeletons) for all dashboard pages
- [ ] Error boundaries for dashboard pages
- [ ] Toast notifications for all mutations (create event, RSVP, check-in)
- [ ] SEO metadata for public pages (`/events`, `/events/[id]`)
- [ ] Accessibility audit (ARIA labels, focus management, keyboard navigation)

**Acceptance criteria:**
- [ ] An admin can approve or reject pending organizations with notes
- [ ] An admin can view and search all platform users
- [ ] The admin dashboard shows real metrics from live data
- [ ] All dashboard pages work on mobile screens
- [ ] All interactive elements have loading and error states

---

## Feature-Level Completion Matrix

| Feature Category | What Exists | What's Missing | % Done |
|-----------------|-------------|----------------|--------|
| **Landing Page** | Full marketing homepage, waitlist, brand system | Nothing -- complete | 100% |
| **Authentication** | Sign-up, sign-in, email confirmation, session refresh, route protection, sign-out | Google OAuth (post-MVP), magic link (post-MVP) | 95% |
| **User Profiles** | Profile creation trigger, display name edit, read-only email display | Avatar upload, self-service account deletion (staff delete exists on **`/admin`**) | 75% |
| **Organizations** | Create org, auto-slug, type selection, membership check, sidebar display | Org settings page, member management, logo upload | 40% |
| **Events** | Public **`/events`** + **`/events/[slug]`**; organizer CRUD + flyers; admin review/publish; categories, RSVP integration | Deeper moderation UX polish, richer media gallery (beyond MVP) | ~75% |
| **Ticketing** | Free RSVP + paid Stripe Checkout (when configured); wallet **`/tickets`**; wallet passes (env-gated) | Tax, Connect, automated refunds | ~75% |
| **Payments** | Stripe Checkout + webhook mint (USD, migration **`030`**) | Payouts, reporting, dispute automation | ~35% |
| **Door Check-In** | Organizer event check-in flows (e.g. **`/organizer/.../check-in`**), APIs; wallet QR when configured | Dedicated door UX polish, live Realtime counters (Phase 5 backlog) | ~35% |
| **Admin** | Overview metrics, posts CRUD + media, events tooling, optional user delete (service role), registrations | Full approval-queue polish, org approval UX, enhanced analytics | ~40% |
| **Responsive Design** | Landing page responsive, dashboard desktop-only | Mobile sidebar, responsive dashboard | 50% |
| **Documentation** | Full spec, brand system, architecture, coding standards, onboarding | Domain contracts (Layer 2), user journeys (Layer 3) | 70% |

---

## Technical Debt & Known Issues

| Issue | Severity | Fix Phase | Status | Notes |
|-------|----------|-----------|--------|-------|
| Org type enum mismatch: DB had (venue/partner/promoter) but form uses collective/brand/nonprofit/independent | **High** | Phase 1.1 | **FIXED** (migration 008) | Enum values added; form and DB now match |
| Status vocabulary mismatch: DB had `pending` but code uses `pending_review` | **High** | Phase 1.1 | **FIXED** (migration 008) | `pending_review` added to `org_status` and `event_status` enums |
| Subscribers table allowed public SELECT (email enumeration risk) | Medium | Phase 1.1 | **FIXED** (migration 009) | Replaced with admin-only read policy |
| Profile `role_admin` column writable by authenticated users | Medium | Phase 1.1 | **FIXED** (migration 007) | Column-level REVOKE + selective GRANT on profiles |
| Dashboard sidebar is desktop-only (fixed `w-64`, no mobile collapse) | Medium | Phase 6 | Open | Users on mobile cannot navigate the dashboard |
| Tickets route mismatch | — | Phase 3 | **Resolved** | **`/tickets`** + **`/tickets/[id]`** live; sidebar/nav use canonical paths; `/dashboard/tickets` alias retained |
| Organizer flyer upload **400** in production (Server Action default **1MB** body vs app **5MB** cap) | Medium | Phase 2 | **FIXED** (April 2026) | `next.config.mjs` `experimental.serverActions.bodySizeLimit` (**6mb** transport vs **5MB** file max); shared rules in `lib/events/flyer-upload-constraints.ts` — see `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` |
| No loading.tsx in dashboard routes (except `/login`) | Low | Phase 6 | Open | No skeleton states during server component loading |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` env var in signup page | Low | Phase 2 | Open | Should use origin consistently; dev-only var may cause issues |
| No error boundaries in dashboard routes | Low | Phase 6 | Open | Unhandled errors show generic Next.js error page |
| Profile form uses client-side Supabase write instead of server action | Low | Phase 1.1 | Open | Inconsistent with Rule 2 (mutations in server actions); low risk since RLS + column privileges prevent escalation |

---

## Environment Variables

### Currently Required

| Variable | Set? | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Supabase anonymous key |

### Required for Paid Ticketing (Live since June 2026)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key |
| `TICKET_PLATFORM_FEE_PERCENT` (optional) | ViZb service fee percentage on paid tickets |
| `TICKET_PLATFORM_FEE_FIXED_CENTS` (optional) | ViZb fixed service fee per paid ticket |

> Verify configuration per environment via **`/admin/diagnostics/stripe`**. Full list: **`.env.example`**.

---

## Maintenance and next review

**Schema / migrations:** Canonical apply order and drift checks live in **`docs/database/MIGRATIONS.md`**. Use timestamped files under **`supabase/migrations/`** for new database work (team rule).

**Product priorities:** See **`docs/plans/NEXT_ROADMAP.md`** for current follow-ups (older roadmaps live in `docs/archive/`). Refresh this roadmap’s **Phase Completion Summary** and audit stamp when phase gates or shipped scope change.

---

## Post-MVP Features (Backlog)

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| QR code scanning for door check-in | High | Medium | Replace manual tap with camera-based scan |
| Stripe Connect for organizer payouts | High | Large | Automated revenue sharing |
| Google OAuth | Medium | Small | One-click signup via Supabase dashboard config |
| Push notifications for event reminders | Medium | Medium | Requires service worker setup |
| Event recommendations / "For You" feed | Low | Large | Needs usage data first |
| Social features (follow organizers, invite friends) | Low | Large | Post-traction feature |
| Event chat / community features | Low | Large | Post-traction feature |
| Light mode support | Low | Medium | Brand system currently dark-mode only |

---

*Last Updated: June 10, 2026 (v6)*
*Current snapshot: Phases 1–6 MVP shipped — paid Stripe ticketing live with admin ops tooling (diagnostics, revenue), door QR check-in, posts MVP, discovery polish. Remaining: ops hardening + polish — see Phase Completion Summary table above.*
*Next Review: After a major migration batch or production release; see docs/plans/NEXT_ROADMAP.md.*

**Revision History:**
- **v1:** Initial draft with phase breakdown and feature matrix
- **v2:** Applied 10-point audit (enum fixes 008, route clarification, storage spec, security hardening 007/009)
- **v3:** Added verification steps for all critical security fixes + post-migration regression checklist
- **v4:** Added migration map, evidence column for verification steps, regression checklist environment/accounts/known-failures. Replaced "no issues found" with honest status language. No critical blockers beyond tracked technical debt.
- **v5:** Aligned feature matrix + footer with shipped code; replaced obsolete “Phase 2 execution order” block with maintenance pointers (`MIGRATIONS.md`, `PUSH_FORWARD_ROADMAP.md`).
- **v6 (June 10, 2026):** Truth pass — header/status reconciled with June 2026 ships (#113–#118 epic, Stripe ops #124–#131, archive RLS fix, launch visual polish); Stripe marked LIVE in integrations + env tables; Phase 4 acceptance criteria checked; migration count corrected; roadmap pointers moved to `docs/plans/NEXT_ROADMAP.md`.
