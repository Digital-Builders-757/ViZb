You are working in the ViZb repo.

Your mission:
Create and execute a cohesive site-wide visual overhaul plan for ViZb that preserves and expands the existing underwater / neon / glass / editorial feel.

This is not a rebrand.
This is a system-level visual refinement pass that should make the entire product feel like one intentional world.
## North star
Keep and deepen the parts of the ViZb aesthetic that already feel strongest:
- underwater / oceanic atmosphere
- neon glass surfaces
- cinematic dark backgrounds
- premium editorial typography
- glowing but restrained motion
- “Virginia Isn’t Boring” energy
- immersive, modern, nightlife/culture-forward product feel

Do NOT flatten it into generic SaaS UI.
Do NOT replace the vibe with default shadcn-looking surfaces.
Do NOT introduce new UI libraries unless absolutely necessary.
## Current repo reality
The strongest visual language currently appears in newer public-facing surfaces and primitives, including patterns around:
- `AppShell`
- `GlassCard`
- `WaterFrame`
- `OceanDivider`
- `NeonLink`
- home page
- events landing surfaces
- public lineup page

The biggest visual drift / inconsistency appears in:
- posts surfaces
- auth surfaces
- organizer surfaces
- admin/dashboard surfaces
- older flat `brand-blue` / `brand-cyan` / `border-border` treatments that do not fully match the newer underwater neon system

## First step — create the plan doc
Create:
`docs/VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md`

That doc should become the source of truth for this visual overhaul and must include:
1. visual north star
2. current-state audit
3. design system rules
4. prioritized phases
5. exact definition of done for each phase
6. affected routes/components
7. progress checklist
8. risks / constraints
9. open questions if any

After creating the doc, begin implementation from Phase 1 and keep the doc updated as you complete work.

---

# Visual direction requirements

## Keep
- underwater / caustic / glass atmosphere
- neon cyan + violet energy
- dark immersive backgrounds
- serif + mono + clean sans hierarchy
- cinematic event presentation
- editorial spacing and rhythm
- mobile-first polish

## Improve
- consistency across all routes
- depth, hierarchy, and premium feel
- route-aware navigation
- loading / empty states
- visual cohesion between public pages and logged-in product surfaces
- form styling consistency
- media treatment consistency
- motion consistency

## Avoid
- generic AI-looking UI
- random gradients
- random border values/opacities
- mixed button systems
- flat internal-tool dashboards that feel detached from the brand
- one-off styling that does not contribute to the system

---

# Implementation phases

## Phase 1 — system alignment
Goal:
Establish the site-wide visual system rules and reduce style drift.

Tasks:
- audit existing typography, spacing, card shells, link/button patterns, dividers, and container widths
- standardize repeated surface patterns around the newer neon glass system
- identify older legacy classes/usages that should be migrated gradually
- create/expand reusable primitives rather than patching page-by-page with one-offs
- ensure public pages and dashboard pages can share a coherent vocabulary

Definition of done:
- the master plan doc exists and clearly defines the visual system
- shared primitives are identified and reused intentionally
- obvious legacy drift areas are documented
- a clear migration path exists for older `brand-blue` / `brand-cyan` style surfaces
- no unnecessary new primitive is added if an existing one can be extended

## Phase 2 — public surface polish
Goal:
Make public-facing pages feel premium, cinematic, and consistent.

Priority surfaces:
- `/events`
- `/events/[slug]`
- `/lineup/[eventSlug]`
- `/p`
- `/p/[slug]`
- `/advertise`
- homepage sections if needed for consistency
- nav/footer behavior on public pages

Tasks:
- strengthen hero/header rhythm
- improve section transitions and page flow
- unify image overlays, chips, metadata treatment, and CTAs
- make event detail pages feel like “show pages”
- give posts a more editorial identity
- ensure no dead or weak nav interactions appear on route-specific pages

Definition of done:
- public pages clearly belong to the same visual family
- posts no longer feel flatter or more generic than events/lineup
- event detail pages feel premium and immersive
- nav/footer feel intentional and route-aware
- mobile layouts remain elegant and readable
- empty states and no-data states feel designed, not fallback-ish

## Phase 3 — organizer and admin reskin
Goal:
Make internal product surfaces feel like a premium control room, not a separate older app.

Priority surfaces:
- organizer dashboard
- organizer event detail / management pages
- attendee panels / tables
- admin overview
- admin event detail
- dashboard overview surfaces
- relevant loading states

Tasks:
- replace flat legacy panels with the updated neon glass system where appropriate
- improve stat cards, page headers, empty states, tables, action bars, and form presentation
- preserve clarity and density needed for operations work
- keep admin/organizer pages visually aligned with ViZb’s public brand language

Definition of done:
- organizer/admin surfaces feel unmistakably part of ViZb
- stats, controls, cards, and tables have coherent depth/hierarchy
- primary pages no longer rely on outdated-looking flat accent treatments
- the product side feels premium without sacrificing usability
- mobile/tablet responsiveness is preserved

## Phase 4 — forms, states, and motion pass
Goal:
Unify the final layer of polish across the app.

Tasks:
- standardize inputs, selects, textareas, toggles, and action rows
- unify loading skeletons, empty states, and success/error states
- refine hover/focus/press transitions
- respect `prefers-reduced-motion`
- make interaction polish feel deliberate and consistent

Definition of done:
- forms across auth, organizer, admin, and public interactions feel visually related
- focus states are branded and accessible
- skeletons match final surfaces
- motion feels consistent and premium, not noisy
- all key routes feel “finished”

---

# Specific areas to look at carefully
## Strong references to preserve and extend
Use the strongest newer surfaces as references for where the system is heading.

## Known drift areas
Pay extra attention to:
- posts pages
- login/auth screens
- organizer dashboards
- admin pages
- old stat cards
- old bordered empty states
- table styling
- pages with mixed old + new token usage
---

# Constraints
- prefer minimal-diff improvements where possible
- no unnecessary rewrites
- no new UI library unless truly required
- preserve business logic and data behavior
- do not break auth, RLS, tickets, RSVP, lineup, or organizer/admin workflows
- prioritize mobile responsiveness from the start
- keep accessibility intact
- keep performance in mind, especially with backgrounds/effects

---

# Required workflow
1. Create `docs/VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md`
2. Fill it with the full phased plan and definitions of done
3. Implement Phase 1
4. Update the plan doc as you go
5. Move into later phases in priority order
6. Reuse or extend existing primitives before making new ones
7. After each meaningful batch, report:
   - files changed
   - what visual problem was solved
   - what remains
   - whether definition of done for that phase is met

---

# Output expectations
When you respond after working, include:

## 1. Plan status
- what phase you are in
- whether the master plan doc was created/updated

## 2. Changes made
- exact files changed
- what visual system or surface was improved

## 3. Definition of done check
- which criteria are now satisfied
- which are still open

## 4. Next best move
- the most important next visual pass to continue with

Be opinionated, consistent, and system-minded.
Think like a creative director plus product designer, not just a code formatter.

---

## Design system rules (implementation reference)

- **Neon spectrum in Tailwind:** `neon-a` (cyan), `neon-b` (violet), `neon-c` (magenta) are registered in `@theme inline` in [`app/globals.css`](app/globals.css). Prefer these over legacy `brand-*` utilities for new work and refactors.
- **Primary CTA gradient:** utility class `.vibe-cta-gradient` (violet → cyan, dark text on fill). Use with `.vibe-focus-ring` where keyboard focus matters.
- **Form controls:** `.vibe-input-glass` + `.vibe-focus-ring` for glass fields that match the dashboard/editorial system.
- **Card shells:** `GlassCard` (+ optional `emphasis` / `interactive`) for surfaces; pair with `.card-accent-*` when a thin top accent strip helps scanability (stats, KPIs).
- **Motion:** `.animate-neon-border-flow` replaces inline `animate-[neon-border-flow_…]` so `prefers-reduced-motion` can disable the shift. Auth bubble layers use `.auth-bubble-field` for the same reason.

## Drift migration notes

- Legacy `brand-blue`, `brand-cyan`, etc. remain in `@theme` for backwards compatibility; TSX has been migrated to `neon-*` in organizer/admin components and related pages where drift was highest.
- `.card-accent-*`, `.gradient-border`, and `.neon-glow*` CSS classes now use `var(--neon-*)` so they stay aligned if tokens shift.

## Progress checklist (living)

| Area | Status |
|------|--------|
| System tokens + `.vibe-cta-gradient` + theme `neon-*` | Done |
| Legacy accent CSS (card-accent, glows, gradients) → neon vars | Done |
| Navbar: active route + `/#about` from any page | Done |
| Posts `/p`, `/p/[slug]`: AppShell, divider, editorial empty | Done |
| Events listing: ambient orbs use neon tokens | Done |
| Auth: login / signup glass forms, vibe inputs, reduced-motion | Done |
| Auth: forgot password neon shell + vibe CTA | Done |
| NeonLink / NeonButton / advertise submit: shared border animation + a11y motion | Done |
| Organizer dashboard: GlassCard stats, pending notice, empty CTA | Done |
| Open mic panel: GlassCard + vibe inputs | Done |
| Event edit form: vibe inputs + sticky bar | Done |
| Admin overview: GlassCard stat grid + posts quick links card | Done |
| Public event detail polish (icon hierarchy) | Light pass (clock accent) |
| Remaining `.form-card` / `input-premium` pockets | **Done (ship polish):** organizer event detail flyer + details shells, admin event detail shells, ticket tiers + attendees panels, create-event + host-application + admin create-org forms → `GlassCard` + `card-accent-*` + `vibe-input-glass` / `vibe-cta-gradient` |

## Finish pass (ship to `develop`) — finalized 2026-04-18

- Removed repo-only draft **`.ship-pr-body.md`** (not part of the product).
- Replaced legacy **`form-card`** wrappers on high-traffic organizer/admin surfaces with **`GlassCard`** (`emphasis` + thin **`card-accent-cyan`** / **`card-accent-blue-mid`** strips) so panels match the neon-glass system.
- Migrated remaining **`input-premium`** fields to **`vibe-input-glass`** + **`vibe-focus-ring`** (create event, host application, admin org invite, ticket tier field grid).
- Aligned sticky/footer primary actions to **`vibe-cta-gradient`** + **`vibe-focus-ring`** where those forms still used ad-hoc gradients.
- Left **`.form-card` / `.input-premium` in `globals.css`** for any stragglers or third-party markup; TSX no longer depends on them for the touched routes.

## Follow-ups (non-blocking)

- Sweep remaining shadcn-default panels on low-traffic routes with `GlassCard` where it improves hierarchy without hurting density.
- Optional: route-level loading skeletons tuned to glass surfaces (e.g. [`app/events/loading.tsx`](app/events/loading.tsx)).