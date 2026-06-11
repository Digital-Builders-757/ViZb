# VIZB Underwater Visual System 2.0

**Status:** Canonical art-direction reference (June 2026)  
**Supersedes:** Ad-hoc per-route glow markup; complements [`docs/VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md`](../VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md)  
**Tokens:** [`app/globals.css`](../../app/globals.css) · **Handoff:** [`docs/REDESIGN_HANDOFF.md`](../REDESIGN_HANDOFF.md)

---

## 1. North star

ViZB should feel like **one underwater culture world**: cinematic dark depth, neon glass surfaces, restrained motion, and editorial typography. Users enter a nightlife/discovery atmosphere—not a generic events marketplace.

**Keep:** caustic light, glass blur, cyan/violet accents, zero-radius editorial sharpness where brand requires it, `WaterFrame` flyers, mono labels.  
**Avoid:** flat gray SaaS panels, random one-off gradients, unbounded glow, motion that fights readability.

---

## 2. Token map (CSS → usage)

| Token / utility | Role | Use on |
|-----------------|------|--------|
| `--neon-bg0`, `--neon-bg1` | Void / depth base | Page backgrounds, hero scrims |
| `--neon-surface`, `--neon-hairline` | Glass fill + edge | `GlassCard`, inputs, chips |
| `--neon-text0` → `--neon-text2` | Hierarchy | Headlines → helpers |
| `--neon-a/b/c` | Accent spectrum | CTAs, badges, caustic hints |
| `--water-a`, `--water-b` | Liquid frame edges | `WaterFrame`, loaders |
| `--ocean-divider-*` | Section transitions | `OceanDivider` |
| `--vibe-neon-glow-subtle` | Hover/focus halo | Cards, stat tiles |
| `--vibe-focus-ring` | Keyboard focus | Buttons, links, form controls |
| `.vibe-input-glass` | Form fields | Auth, advertise, admin forms |
| `.text-readable-secondary` | Muted body copy | Empty states, form hints |

---

## 3. Primitive map (components → rules)

| Primitive | File | When to use |
|-----------|------|-------------|
| `AppShell` | `components/ui/app-shell.tsx` | Signed-in + marketing shells needing shared backdrop |
| `GlassCard` | `components/ui/glass-card.tsx` | Any elevated panel; `interactive` only on hero cards |
| `WaterFrame` | `components/ui/water-frame.tsx` | Event flyers, hero media |
| `WaterLoader` | `components/ui/water-loader.tsx` | Global/route loading (CSS-only) |
| `OceanDivider` | `components/ui/ocean-divider.tsx` | Section breaks on long pages |
| `NeonLink` / `NeonButton` | `components/ui/neon-*.tsx` | Primary/secondary CTAs |
| `EmptyStateCard` | `components/ui/empty-state-card.tsx` | Zero-data states |
| `CausticBackdrop` | `components/ui/caustic-backdrop.tsx` | Route atmosphere (see #165) |
| `DepthLayer` | `components/ui/depth-layer.tsx` | Parallax depth stacks (see #165) |

**Rule:** New routes must compose primitives before adding bespoke `absolute` glow divs.

---

## 4. Surface recipes

### 4.1 Public discovery (`/`, `/events`)

- Background: `AppShell` with neon backdrop OR static CSS caustic (no Three.js on first paint for `/events`).
- Cards: `GlassCard` + `.events-neon-card` where timeline density needs glow discipline.
- Flyers: `WaterFrame` + branded fallback (`EventFlyerFallback`).
- Motion: timeline cards non-interactive on `/events` listing for perf.

### 4.2 Event detail (`/events/[slug]`)

- Hero: flyer `WaterFrame` 4:5, metadata in glass stack.
- Actions: `NeonButton` primary for RSVP/buy; `MyVibesButton` secondary pill.
- Dividers: `OceanDivider` between long sections when added in show-page pass (#171).

### 4.3 Auth (`/login`, `/signup`)

- Full-bleed ocean gradient + bubble field (existing).
- Form: glass card + `vibe-input-glass` + `NeonButton` pill submit.
- No Three.js.

### 4.4 Dashboard / organizer / admin

- **Control-room target (#168):** shared shell, stat tiles with `card-accent-*`, mono kickers, serif H1.
- Tables: hairline borders, cyan header wash—no pure white backgrounds.
- Admin overview: action cards first; heavy data tables on dedicated pages (see `/admin/users`).

### 4.5 Posts (`/p`, `/p/[slug]`)

- Cover: `WaterFrame` or post-cover aspect; body readable width ≤ 720px.
- Gallery: consistent gap + hairline frames.

---

## 5. Typography

| Level | Font | Example |
|-------|------|---------|
| Display / H1 | Playfair (`font-serif`) | Page titles |
| UI labels | JetBrains Mono (`font-mono`, uppercase tracking) | Kickers, badges |
| Body | Space Grotesk (`font-sans`) | Descriptions, forms |

**Line length:** prose blocks max ~65ch; event blurbs may truncate on cards, full copy on detail only.

---

## 6. Motion choreography (#167)

| Pattern | Duration | Reduced motion |
|---------|----------|----------------|
| Hover glow | 150–250ms ease | Static border only |
| Card tilt (`GlassCard interactive`) | subtle, pointer-only | Disabled |
| Bubble / caustic drift | 8–14s loop | `animation: none` |
| Route enter | none or 200ms opacity | none |

Use `prefers-reduced-motion: reduce` overrides in CSS—not JS detection alone.

---

## 7. Media treatment (#166)

- Flyers: Next/Image with explicit `sizes`; fallback gradient + date glyph.
- Real photos: slight scrim overlay when used as full-bleed (`opacity-30` max under text).
- No stretched logos; min contrast 4.5:1 on text over images.

---

## 8. Performance budgets (#170)

| Metric | Budget | Notes |
|--------|--------|-------|
| LCP (mobile) | < 2.5s | Hero image or static backdrop first |
| CLS | < 0.1 | Reserved flyer aspect ratio |
| `/events` first visit | No WebGL | Static caustic CSS |
| Hero WebGL (`/`) | Lazy + pause hidden tab | `three-background.tsx` caps DPR |
| JS per route | Avoid new heavy deps | CSS-first atmosphere |

---

## 9. Visual QA scorecard (PR review)

Score each route **0–2** per row (0 = fail, 1 = partial, 2 = pass). **Ship threshold: ≥ 14/18** on touched routes.

| # | Criterion | Questions |
|---|-----------|-----------|
| A1 | **Atmosphere** | Does the page feel underwater/neon-glass without one-off hacks? |
| A2 | **Hierarchy** | Is H1 → body → helper text obvious at a glance? |
| A3 | **Media** | Flyers/photos framed (`WaterFrame` or documented exception)? |
| A4 | **Motion** | Animations restrained + reduced-motion safe? |
| A5 | **Mobile** | No horizontal scroll; tap targets ≥ 44px on primary CTAs? |
| A6 | **Contrast** | Text readable on glass (text0/text1, not pure gray-500)? |
| A7 | **Performance** | No new WebGL on listing routes; images sized? |
| A8 | **Consistency** | Uses shared primitives/tokens vs legacy `brand-blue` flats? |
| A9 | **Empty/loading** | Branded empty + loader, not blank screens? |

**Routes to score when changing UI:**

1. `/` (homepage)  
2. `/events`  
3. `/events/[slug]`  
4. `/p` + `/p/[slug]`  
5. `/login`  
6. `/dashboard`  
7. `/organizer/[slug]`  
8. `/admin`  

---

## 10. Approved vs disallowed

| Approved | Disallowed |
|----------|------------|
| Token-based glass cards | `#ffffff` cards on dark pages |
| `NeonLink` / `NeonButton` for CTAs | Raw `<button className="bg-blue-600">` |
| `OceanDivider` between major sections | Random `hr` with inline styles |
| Branded flyer fallback | Empty gray box |
| Scoped server logging banners in admin | Silent failure redirects |

---

## 11. Implementation sequence (GitHub)

1. **#163** — This document + scorecard  
2. **#165** — `CausticBackdrop` / `DepthLayer`  
3. **#167** — Motion tokens  
4. **#169** — Unified loading/empty/error  
5. **#166** — Flyer/image treatment  
6. **#164** — Homepage hero cinematic pass  
7. **#170** — Perf regression checks  
8. **#168** — Dashboard/organizer/admin reskin  
9. **#171** — Event show page  
10. **#172** — Asset quality guidelines  

---

## 12. Open questions

- **Photography library:** Curate approved real-photo overlays (#172).  
- **Three.js scope:** Homepage only vs selective hero routes—default homepage only until perf budget passes.
