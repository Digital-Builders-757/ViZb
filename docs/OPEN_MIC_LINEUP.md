# Open Mic Lineup V1 — Plan, Product Spec, and Definition of Done

## Status
Shipped (V1 — April 2026). See `supabase/migrations/20260417210000_event_lineup_entries.sql`, `app/actions/lineup.ts`, `app/lineup/[eventSlug]/page.tsx`.

## Public lineup URL (canonical)

- **Route:** `/lineup/[eventSlug]` — the slug is the **`events.slug`** for a **published** event whose **`categories`** include **`open_mic`**.
- **Signal 91 (example):** event slug **`signal-91`** → path **`/lineup/signal-91`**.
- **Full URL in production** is **`NEXT_PUBLIC_SITE_URL`** + that path (see **`.env.example`**). Code helpers: `lib/public-site-url.ts` (`getPublicLineupAbsoluteUrl`, `getPublicLineupShareTarget`).
- **Verified live (April 2026):** `https://www.vizbva.com/lineup/signal-91` returns **200**; the apex host may **307** to `www` — prefer the **`www`** URL (or set **`NEXT_PUBLIC_SITE_URL`** to `https://www.vizbva.com`) so shared links match the final host without an extra redirect.
- **Organizer UI:** **Open mic lineup** panel shows the share target and **Copy public link** (`components/organizer/open-mic-lineup-panel.tsx`).

## Purpose
This document defines the first version of the **Open Mic Lineup** feature for ViZb.
The goal is to support open mic events, like **Signal 91**, with a lightweight but reliable workflow that lets organizers:

1. maintain a performer list inside the dashboard
2. manually add and reorder performers
3. reference the lineup during the event
4. optionally publish a public-facing lineup page on a separate URL

This is a **practical V1**, not the final end-state. The focus is speed, clarity, and usefulness during real live events.

---

## Problem
Open mic events need a simple way to track who is performing and in what order.
Right now, ViZb supports events and RSVP/ticket flows, but it does not yet provide a dedicated workflow for:

- manually entering performer names
- keeping a running performer lineup
- marking who is confirmed / performed / no-show
- sharing that lineup publicly at a separate URL

This creates operational friction for hosts and makes it harder to use ViZb as the actual event operations layer.

---

## Goal
Add a first-class **Open Mic Lineup** feature to ViZb that supports:

- dashboard lineup management
- separate public lineup URL
- event-linked performer order
- live operational reference during the event

---

## Product Decision
### V1 approach
We are intentionally starting with the simplest useful version:

- **staff/admin/host-managed lineup**
- **manual entry**
- **manual ordering**
- **public read-only lineup page**
- **linked to an event**
- **separate public URL**

### We are NOT starting with:
- performer self-signup
- live audience submissions
- complex moderation queues
- SMS confirmations
- "now performing" realtime socket indicators
- drag-and-drop if simple ordering controls are faster to ship
- a separate standalone lineup system outside events

This is an **event-linked operational feature**, not a new app inside the app.

---
## Core User Story
### Organizer / host
As an organizer or host running an open mic event, I want to quickly enter performer names, set the lineup order, and update statuses so I can run the event smoothly.

### Public audience
As an attendee or performer, I want to view the current lineup on a separate public page so I can see who is performing and what the order looks like.

---

## Scope

## In Scope
- add `open_mic` as a valid event category
- create a lineup table linked to events
- organizer/admin dashboard UI for managing lineup entries
- public lineup page on a separate URL
- manual add/edit/remove/reorder flow
- basic status management
- public visibility toggle
- safe schema migration
- RLS / permission handling
- docs update

## Out of Scope for V1
- public performer signup form
- performer claim/auth flow
- realtime websockets
- check-in via lineup QR
- multiple sets / rounds / rooms
- audience voting
- host notes hidden per device
- audio/video recording workflows
- advanced analytics

---

## Event Model Decision
This feature should only apply to events that are category `open_mic`.

If future event types also need a lineup workflow, we can later generalize further. For now, the initial UI and public page logic should assume:

- the event exists
- the event is an open mic
- the organizer/admin is managing a performer list tied to that event
---

## Recommended Route Design

## Dashboard / Organizer route
The lineup manager should live inside the organizer/admin event management experience for a specific event.

Recommended placement:
- inside the organizer event detail page
- inside admin event management for staff/admin
- shown only when `event.category = open_mic`

### Example
- `/organizer/events/[eventSlug]`
- lineup panel or tab: `Open Mic Lineup`
## Public route
The public lineup should have its own clean URL.

### Recommended public route
- `/lineup/[eventSlug]`

Alternative acceptable routes:
- `/open-mic/[eventSlug]`
- `/events/[eventSlug]/lineup`

### Decision
Preferred V1 route:
- **`/lineup/[eventSlug]`**
This is short, shareable, and clearly separate from the main event detail page.

---

## Data Model

## Recommended table
Use a dedicated table:

- **`event_lineup_entries`**

This is better than naming it `open_mic_signups` because it keeps the table future-friendly while still serving open mic now.

## Recommended columns
### Core columns
- `id` UUID primary key
- `event_id` UUID not null references `events(id)` on delete cascade
- `performer_name` text not null
- `stage_name` text null
- `notes` text null
- `slot_order` integer not null default `0`
- `status` enum not null default `pending`
- `is_public` boolean not null default `true`
- `created_by` UUID null references `profiles(id)`
- `created_at` timestamptz not null default `now()`
- `updated_at` timestamptz not null default `now()`

### Optional later columns
These are not required for V1, but acceptable if helpful:
- `checked_in_at` timestamptz null
- `performed_at` timestamptz null
- `performance_type` text null
- `pronunciation_note` text null

---

## Recommended enum
Create a lineup status enum if one does not already exist.

### `lineup_entry_status`
Recommended values:
- `pending`
- `confirmed`
- `performed`
- `no_show`
- `cancelled`

### Status meaning
- `pending` = entered but not yet fully confirmed
- `confirmed` = expected to perform
- `performed` = has completed performance
- `no_show` = did not perform
- `cancelled` = removed from active lineup without deleting row history

---

## RLS / Access Rules

## Public access
Public users may read lineup entries only when:

- the event is published
- the event category is `open_mic`
- the lineup entry has `is_public = true`
- the lineup entry status is appropriate for public display

### Recommended public-visible statuses
- `confirmed`
- `performed`

Optional:
- allow `pending` publicly if the organizer wants looser visibility, but V1 should default to a tighter public list

## Organizer/admin access
Organizers, staff, and admins should be able to:

- create lineup entries
- update lineup entries
- change order
- toggle public visibility
- change status
- soft-remove/cancel entries

### Principle
Use the same event ownership / org membership logic already used for event editing where possible.

---

## UI / UX Requirements
## Dashboard lineup manager
For open mic events, show an **Open Mic Lineup** management area in the event dashboard.

### V1 features
- quick add performer row
- edit performer name
- optional stage name
- optional notes
- slot order
- status badge
- public visibility toggle
- remove/cancel action
- reorder controls
### Reordering
For V1, reordering can be:
- up/down buttons
- numeric slot editing
- or drag-and-drop if the existing system already supports it cleanly

**Do not overcomplicate this.**
Simple and reliable beats fancy.

## Recommended table columns
- Order
- Performer
- Stage Name
- Status
- Public
- Notes
- Actions

## Recommended actions
- add row
- edit row
- move up
- move down
- mark confirmed
- mark performed
- mark no-show
- cancel/remove
- copy public lineup link

---
## Public Lineup Page Requirements

## Route
- `/lineup/[eventSlug]`

## Page contents
The page should show:
- event title
- event date/time
- venue / city if available
- optional short helper line like:
  - "Live lineup"
  - "Open mic order"
- ordered list of public lineup entries
## Each lineup row should show
- position number
- performer name
- stage name if present
- optional simple status indicator if useful

## Public UX principles
- clean
- mobile-friendly
- easy to scan
- shareable
- not overloaded with dashboard controls

## V1 update behavior
The public page should reflect the current database state when loaded.

Acceptable V1 behavior:
- update on refresh
- optionally use dynamic rendering / low revalidation interval

Realtime is not required for V1.

---

## Category Update
This feature requires `open_mic` to exist as a supported event category.

That means `open_mic` must be added everywhere needed:
- schema / enum if category is enum-backed
- event creation/edit forms
- event filters
- labels/badges
- validation
- display mapping
- any docs/contracts referencing event categories

---

## Implementation Plan

## Phase 1 — Schema
1. add `open_mic` event category
2. create `lineup_entry_status` enum
3. create `event_lineup_entries` table
4. add indexes
5. add updated_at handling if needed
6. add RLS policies

## Phase 2 — Dashboard UX
1. detect when an event is category `open_mic`
2. render lineup manager section
3. implement add/edit/update/reorder/cancel flows
4. show clear status and public visibility controls
5. ensure staff/admin/organizer permissions work

## Phase 3 — Public page
1. create `/lineup/[eventSlug]`
2. load event + public lineup entries
3. render clean ordered lineup
4. handle empty states gracefully
5. confirm mobile responsiveness

## Phase 4 — Docs / polish
1. update docs/contracts/events.md if category logic changes
2. update any source-of-truth docs for event lifecycle/category support
3. add regression checklist
4. verify no permission regressions

---

## Definition of Done

The feature is done when all of the following are true:
## Category support
- `open_mic` exists as a valid event category everywhere needed
- organizers/admins can create and edit open mic events without category errors
- filters and badges display it correctly

## Dashboard lineup manager
- open mic events show a usable lineup management section
- staff/admin/organizers can add performers manually
- lineup entries can be edited
- lineup entries can be reordered
- statuses can be changed
- entries can be hidden from the public page
- the UI is clear enough to use during a real live event
## Public lineup page
- a separate public URL exists for each open mic event
- the page shows the current public lineup
- it is readable on mobile
- it does not expose hidden/private lineup entries
- it is suitable for sharing publicly

## Permissions / safety
- public users only see public lineup entries for published open mic events
- non-authorized users cannot edit lineup data
- organizer/staff/admin permissions work correctly

## Quality
- no broken event editing flow
- no broken public event pages
- no category validation regressions
- no obvious ordering bugs
- implementation remains maintainable

---

## Regression Checklist

### Category
- create an event with category `open_mic`
- edit an event and switch category to `open_mic`
- filter events by `open_mic`
- verify category displays correctly in UI

### Dashboard lineup
- add lineup entry
- edit lineup entry
- reorder lineup entries
- mark entry confirmed
- mark entry performed
- mark entry no-show
- hide an entry from public view
- cancel/remove an entry

### Public page
- open `/lineup/[eventSlug]`
- confirm visible entries are ordered correctly
- confirm hidden entries do not appear
- confirm cancelled entries do not appear if they should be hidden
- confirm page works on mobile
### Permissions
- public user cannot edit lineup rows
- organizer/staff/admin can edit lineup rows for owned/manageable events
- unrelated users cannot mutate lineup data

---

## Open Questions
These do not block V1, but should be noted:

1. Should performers eventually self-submit?
2. Should the public lineup show only confirmed performers, or also pending?
3. Do we want a “now performing” state later?
4. Do we want host-only notes hidden from the public page?
5. Should lineup order sync to any event check-in or stage management tools later?

---

## Recommendation
Ship **V1 as a manual, organizer-managed lineup system** with a separate public URL.

This gives ViZb a real operational feature for open mic events quickly, without getting lost in moderation and self-service complexity.

The fastest high-value version is:
- `open_mic` category
- `event_lineup_entries`
- organizer/admin lineup manager
- `/lineup/[eventSlug]` public page