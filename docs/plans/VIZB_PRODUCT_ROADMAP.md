# ViZb Product Roadmap

**Last updated:** May 5, 2026

This is the product order for the next user-facing upgrades. Use it with `docs/ROADMAP_RUNNER.md` for execution and `docs/MVP_STATUS_ROADMAP.md` for the technical / MVP detail.

---

## Product goal

ViZb should win as the curated local event layer for Virginia and the DMV, not as a generic marketplace.

What to borrow from the big platforms:
- **Posh** for curation, social feel, and tasteful discovery
- **Eventbrite** for organizer ease and reliable RSVP flow
- **Ticketmaster** for trust, detail density, and attendance tooling

What to keep from ViZb:
- local editorial identity
- community-first discovery
- strong visual brand
- clear distinction between official ViZb events and outside/community events

---

## Product principles

1. **One events system, clear labels**
   - Keep one model and one admin surface.
   - Distinguish official ViZb events from local/community listings with badges and copy.

2. **Ship one slice fully before starting the next**
   - Each item should end with the relevant docs updated and checks passing.

3. **Reduce RSVP friction**
   - External links should open in a new tab.
   - Add obvious next actions, calendar, reminder, and share paths where useful.

4. **Prefer minimal diffs**
   - Use the existing design system, routing, and data model where possible.

---

## Roadmap

### 1. Local / community events lane

**Why this first:** it is the clearest current product need, and it keeps Elaine's curation work inside the platform without confusing it with official ViZb-hosted events.

**Deliverables:**
- admin entry under Platform events for Local / Community events
- create, edit, publish, archive flow for those listings
- public labels that clearly show official vs community
- flyer, description, date/time, area/location, RSVP link
- external RSVP opens in a new tab

**Definition of done:**
- admins can publish local/community listings
- public users can tell them apart from official events at a glance
- existing official event flow still works unchanged

**Current work order:** `docs/work-orders/local-events-work-order.md`

---

### 2. Discovery that feels local

**Goal:** help users find the right thing fast without turning the site into a generic directory.

**Deliverables:**
- filters such as tonight, this weekend, free, family-friendly, after hours, open mic
- stronger search and sort
- featured local/community rail
- simple map or area context where it adds value
- better empty states and no-results guidance

**Definition of done:**
- users can narrow down events in seconds
- the feed feels local and curated, not noisy

---

### 3. Save, share, and return

**Goal:** keep people coming back after the first visit.

**Deliverables:**
- My Vibes / saved events
- add to calendar
- RSVP confirmation with next-step actions
- reminders or nudges for upcoming events
- share links for friends and group planning

**Definition of done:**
- users can save and revisit events easily
- the app helps them remember and attend

---

### 4. Attendance and door flow

**Goal:** make attendance easy for members and organizers.

**Deliverables:**
- ticket / wallet experience for RSVP-backed events
- QR or code-based check-in
- capacity and attendance states
- clear post-RSVP confirmation
- fast organizer/staff check-in flow

**Definition of done:**
- a guest can RSVP, get the right confirmation, and check in cleanly
- organizers can manage the door without friction

---

### 5. Organizer power tools

**Goal:** make event creation and maintenance faster.

**Deliverables:**
- recurring events
- flyer import or link import
- draft templates
- bulk publish / schedule
- lightweight analytics for views, RSVPs, and attendance

**Definition of done:**
- organizers can create and manage events faster than they can in generic tools

---

### 6. Trust and community signals

**Goal:** make the platform feel safe, curated, and human.

**Deliverables:**
- verified organizer badges
- staff picks / featured community picks
- report spam or bad listings
- post-event recap or photo surfaces
- attendance / popularity signals where appropriate

**Definition of done:**
- users trust the listings more
- the platform feels curated instead of scraped

---

### 7. Growth and monetization

**Goal:** add revenue paths without wrecking the experience.

**Deliverables:**
- featured placements
- sponsorship packages
- promotion slots
- newsletter or notification segments
- organizer upsell paths

**Definition of done:**
- monetization feels useful, not spammy
- revenue supports the event ecosystem

---

## Cursor execution rule

Work top to bottom. Finish the current item before opening the next one.

After each item:
- update the relevant docs
- verify the change
- leave the repo ready to ship

If the work touches events, use:
- `docs/EVENTS_SOURCE_OF_TRUTH.md`
- `docs/contracts/events.md`
- `docs/journeys/guest_discovers_event.md`
- `docs/journeys/member_rsvps_to_event.md`
- `docs/journeys/host_creates_event.md`
