# Work Order, ViZb Community Event Flyer Upload

Related roadmap: `docs/plans/VIZB_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.
Related baseline: `docs/work-orders/local-events-work-order.md`.
Events contract: `docs/contracts/events.md`.

## Goal
Ship a true end-to-end flyer upload workflow for **community / local events** created from the **staff admin dashboard**, so admins can attach a flyer during the creation flow and have that flyer appear across the public event feed and event detail surfaces used by members.

This is a product-completion task, not a storage-infrastructure task.

## Current status (shipped)

**Behavior (matches shipped code):**
- **Community listings may include flyers** — stored in `events.flyer_url` via the existing `event-flyers` bucket and `uploadEventFlyer` action.
- **Flyer is optional for submission/review** — `submitEventForReview` for `event_kind=community` requires a valid `external_rsvp_url`, not a flyer.
- **Flyer is recommended for discovery** — create and detail copy frame it as optional for review but strongly recommended for feed visibility and click-through on `/events`, `/events/[slug]`, and homepage rails that read `flyer_url`.
- **Admin create supports inline upload** — `/admin/events/new/community` (`CreateEventForm` with `flow="admin"` + `variant="community"`) accepts an optional flyer picker; orchestration is two-step (`createEvent`, then `uploadEventFlyer` against the new id).
- **Detail page is the fallback/maintenance surface** — `/admin/events/[id]` keeps `FlyerUploadForm` for upload, replace, and remove after create (including when create-time upload is skipped or fails).

**Implementation notes:**
- Upload failure after draft creation redirects to `/admin/events/[id]?flyer_upload=failed&reason=…` with a recovery banner inside the Event Flyer card; the draft is preserved and `createEvent` is not retried.
- Official admin create (`/admin/events/new`) is unchanged — no inline flyer picker; flyer remains required before review for `event_kind=official`.

## Why this work order existed
The repo already supports:
- `events.flyer_url`
- Supabase Storage bucket `event-flyers`
- server action `uploadEventFlyer`
- edit-page upload UI via `FlyerUploadForm`
- public feed/detail rendering that reads `flyer_url`

What was missing from the admin experience (now addressed):
- the **new community event** flow did not let staff attach a flyer before or during draft creation
- community-event copy framed flyer as optional and secondary, which made the upload path easy to miss
- the resulting workflow felt incomplete even though the underlying upload system existed

The outcome should be: **admin can create a community event and attach a flyer in the same flow without hunting for a second screen**.

## Current repo reality

### Already present
- Community listings already exist through `events.event_kind = 'community'`
- Draft creation already happens in `components/organizer/create-event-form.tsx`
- Draft persistence is handled by `createEvent` in `app/actions/event.ts`
- Event flyer upload/remove already exists in `uploadEventFlyer` / `removeEventFlyer` in `app/actions/event.ts`
- Event flyer validation constants already exist in `lib/events/flyer-upload-constraints.ts`
- Admin event detail page already exposes `FlyerUploadForm` in `app/(dashboard)/admin/events/[id]/page.tsx`
- Public surfaces already render `flyer_url` in:
  - `components/events-section.tsx`
  - `components/hero-section.tsx`
  - `app/events/page.tsx`
  - `app/events/[slug]/page.tsx`

### Product gap (closed)
- ~~`CreateEventForm` does not currently capture a flyer file~~ — shipped for admin + community variant
- ~~the admin “new community event” flow therefore feels like “create first, maybe remember to upload later”~~
- ~~user perception is correct: for community events, the workflow does not currently feel like a real upload feature even though the lower-level primitives exist~~

## Product decision
Do **not** invent a second media system.

Use the existing:
- `events.flyer_url`
- `event-flyers` bucket
- `uploadEventFlyer`
- validation constraints
- event detail edit surface

The fix is to close the orchestration gap in the **admin create flow** and make the post-create states explicit.

## Scope

### In scope
- Add flyer selection/upload support to the **admin community-event create flow**
- Keep the same event-flyer storage pipeline already used by event detail pages
- Preserve the existing edit-page uploader as the fallback / maintenance surface
- Make success and failure states explicit when draft creation succeeds but flyer upload fails
- Confirm uploaded flyers appear in the event feed/detail surfaces that already consume `flyer_url`
- Update documentation where the workflow meaningfully changes

### Out of scope
- New storage buckets
- New DB columns
- Rich media galleries for events
- Drag/drop asset manager
- Multiple flyers per event
- Cropping / editing / focal-point tooling
- Changing the rule that community events may still be submitted with no flyer if they have a valid external RSVP URL

## User workflows

### Workflow A: Admin creates a community event with flyer
1. Staff admin opens `/admin/events/new/community`
2. Staff chooses the community/local listing path
3. Form includes the current fields plus an optional flyer picker
4. Staff completes title, date/time, location, description, external RSVP link, and optionally selects a flyer
5. Submit creates the draft event first
6. If a flyer file was selected, the client immediately uploads it against the newly created event id using the existing server action
7. On full success, user lands on `/admin/events/[id]` with the flyer visible

### Workflow B: Admin creates a community event without flyer
1. Staff creates the draft with no flyer selected
2. Draft succeeds normally
3. User lands on `/admin/events/[id]`
4. Event remains valid as a community listing so long as external RSVP requirements are met
5. UI still encourages adding a flyer because it improves discovery/feed presentation

### Workflow C: Draft create succeeds, flyer upload fails
1. Event draft is successfully created
2. Flyer upload fails due to validation, storage, auth, or network error
3. User is not left guessing
4. UI shows:
   - draft created successfully
   - flyer upload failed (with `reason` when available)
   - direct path to continue on `/admin/events/[id]` and retry via `FlyerUploadForm`
5. No duplicate event should be created

### Workflow D: Admin edits existing community event flyer later
1. Staff opens `/admin/events/[id]`
2. Existing `FlyerUploadForm` still works
3. Replace/remove behavior remains intact

## Requirements

### 1. Admin create form
- `CreateEventForm` must support selecting an optional flyer file when `flow="admin"` and `variant="community"`
- Reuse existing event flyer file constraints from `lib/events/flyer-upload-constraints.ts`
- Validation must happen client-side before upload begins
- The form must remain usable without a flyer

### 2. Submission orchestration
- The create flow must remain two-step under the hood:
  - create event draft
  - upload flyer against created event id
- This should happen inside the existing client submit flow, not by inventing a new parallel event creation backend
- If no flyer is selected, behavior should match current create behavior

### 3. Error handling
- Creation error: show existing create error, do not attempt upload
- Upload error after create success: keep draft, surface explicit follow-up action
- File validation errors: show clear message before submit/upload
- Do not swallow upload errors or silently redirect as if everything worked

### 4. Admin event detail continuity
- `FlyerUploadForm` remains the source of truth for later replace/remove behavior
- The admin detail page should continue to show upload UI for draft/pending/rejected states
- Community-event explanatory copy should no longer imply “flyer doesn’t matter”; it should say “optional for submission, recommended for discovery”

### 5. Public surfaces
- After upload, the flyer must appear anywhere the app already renders `flyer_url`
- Minimum verification surfaces:
  - `/events`
  - `/events/[slug]`
  - homepage event/feed rail(s) that use `flyer_url`
  - admin review queue cards where flyers already render
- No new rendering system is required; just verify the existing one reflects the uploaded asset

### 6. Data and storage
- No migration should be required unless implementation discovers a real gap
- Continue storing public URLs in `events.flyer_url`
- Continue using `event-flyers` bucket pathing from the current server action
- Keep permission model aligned to the existing server action + storage policies

### 7. Documentation
- Update the local/community event work-order doc or events contract if the create-flow expectation changes materially
- Add a clear note that community listings can have flyers even though they are not required for review

## Recommended implementation approach

### Preferred path
1. Extend `CreateEventForm` with a flyer input and preview state
2. On submit:
   - call `createEvent(formData)` first
   - if successful and file exists, call `uploadEventFlyer` with returned `event.id`
   - redirect to `/admin/events/[id]` when orchestration finishes
3. Preserve existing `FlyerUploadForm` on the detail page
4. Tighten copy so community listings treat flyer as a distribution asset, not a forgotten optional extra

### Why this path
- Minimal diff
- Reuses current storage and auth model
- Avoids schema churn
- Delivers the “real upload feature” users expect

## Expected files to touch
- `components/organizer/create-event-form.tsx`
- `app/actions/event.ts`
- `components/organizer/flyer-upload-form.tsx` if shared UI extraction helps
- `app/(dashboard)/admin/events/[id]/page.tsx` for copy polish if needed
- `docs/work-orders/local-events-work-order.md`
- `docs/contracts/events.md` only if workflow expectations are updated
- tests around event actions or create-flow behavior where practical

## UX notes
- Keep the UI in the existing ViZb visual system
- No new upload library
- No multi-step wizard unless the current form structure makes it trivial
- Avoid burying the flyer input below the fold with no context
- Copy should frame flyer as:
  - optional for submission
  - strongly recommended for feed visibility and click-through

## Definition of Done

### Product completion
- Staff admin can create a community event and attach a flyer in the same admin flow
- Draft creation does not require a second scavenger-hunt step just to discover flyer upload
- If flyer upload is skipped, the draft still works
- If flyer upload fails, the draft is preserved and the user is clearly told what happened

### Technical completion
- Existing `event-flyers` storage flow is reused
- No duplicate event records are created by retrying upload
- Existing detail-page replace/remove flyer behavior still works
- Existing official-event behavior is not broken

### Public completion
- Uploaded flyer appears on public discovery/detail surfaces that already consume `flyer_url`
- Community events without flyers still render gracefully with existing placeholders/fallbacks

### Documentation completion
- Work order is present in repo
- Local/community event docs reflect the intended create flow
- Cursor can execute from this doc without guessing architecture

## QA checklist

### Admin create flow
- Create community event without flyer
- Create community event with valid JPEG/PNG/WebP/GIF flyer
- Create community event with invalid file type
- Create community event with file > 5MB
- Create community event where upload fails after draft creation and confirm recovery path is clear

### Edit flow
- Replace existing flyer from `/admin/events/[id]`
- Remove existing flyer from `/admin/events/[id]`
- Confirm permissions still behave correctly

### Public surfaces
- Verify flyer renders on `/events`
- Verify flyer renders on `/events/[slug]`
- Verify homepage/event rail surfaces reflect the uploaded flyer
- Verify community event without flyer still renders with current fallback treatment

### Regression
- Official event create flow still works
- Official event flyer requirement before review still works
- Community review submission still keys off external RSVP validity, not flyer presence
- No TypeScript, lint, test, or build regressions

## Verification commands
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Cursor handoff

**Status: implemented.** The items below describe the shipped behavior; use this doc for maintenance/regression context, not greenfield implementation.

### Task (complete)
End-to-end flyer upload for admin-created community events is wired through `CreateEventForm` + `uploadEventFlyer`.

### Hard constraints
- Reuse existing `uploadEventFlyer` and storage bucket patterns
- Do not add a new bucket or a parallel media system
- Do not make community-event flyers required for review
- Keep the current edit-page uploader working

### Acceptance tests
- Admin can create a community event with a flyer in one flow
- Admin can still create a community event without a flyer
- Upload failure after draft creation is explicit and recoverable
- Public event surfaces display the uploaded flyer
- Official-event flow is unaffected

## Notes
- The repo already solved the hard part: storage, constraints, and `flyer_url` rendering
- This work order is about product completeness and admin workflow clarity
- The right answer is a clean orchestration pass, not more infrastructure
