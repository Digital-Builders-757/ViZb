# ViZb redesign handoff (external LLM + design tools)

**Purpose:** Single export package for redesign collaboration on **public marketing and discovery** surfaces. Not a rebrand — refine the existing **underwater neon glass editorial** world.

**Last updated:** June 28, 2026

> **Current-state note:** This handoff remains useful for visual language, but the live homepage was rebuilt after the original June 2 package. For exact ownership, use [ARCHITECTURE_SOURCE_OF_TRUTH.md](ARCHITECTURE_SOURCE_OF_TRUTH.md) and [REPO_MAP.md](REPO_MAP.md).

---

## Quick copy-paste context

| Item | Value |
|------|--------|
| Product | ViZb (copy often says ViBE) — Virginia events & community |
| Taglines | "Driving Culture Forward" · "Virginia Isn't Boring." |
| Scope | `/`, `/events`, `/events/[slug]`, `/p`, `/p/[slug]`, `/advertise`, `/lineup/[eventSlug]` |
| Stack | Next.js App Router, React 19, Tailwind v4, shadcn/ui (new-york), custom neon primitives |
| Runtime tokens | [`app/globals.css`](../app/globals.css) — **source of truth** |
| Full brand law | [`docs/BRAND_SYSTEM.md`](BRAND_SYSTEM.md) |
| Visual overhaul plan | [`docs/VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md`](VIZB_VISUAL_OVERHAUL_MASTER_PLAN.md) |
| External LLM prompts | [`docs/REDESIGN_EXTERNAL_LLM_BRIEF.md`](REDESIGN_EXTERNAL_LLM_BRIEF.md) |

---

## Brand personality (one paragraph)

ViBE sits at **streetwear editorial × community event culture** (Hypebeast × block-party flyer): bold oversized serif headlines, near-black void backgrounds, neon cyan/violet/magenta glass surfaces, real event photography with credits, generous section rhythm, premium blur/glow motion. **Fails** if it could be mistaken for generic SaaS.

---

## Neon glass tokens (paste into design tools)

From [`app/globals.css`](../app/globals.css) `:root`:

```css
--neon-bg0: #05050a;
--neon-bg1: #08081c;
--neon-surface: rgb(255 255 255 / 0.072);
--neon-hairline: rgb(255 255 255 / 0.13);
--neon-text0: #ffffff;
--neon-text1: rgb(218 228 255 / 0.92);
--neon-text2: rgb(178 192 235 / 0.88);
--neon-a: #00d1ff;   /* cyan — primary accent */
--neon-b: #9d4dff;   /* violet */
--neon-c: #ff4ecd;   /* magenta */
```

**shadcn semantic (forms, legacy panels):** `--primary` ≈ ViBE Blue `#0D40FF`, `--accent` cyan family, `--background` near-black.

**Signature headline gradient** (brand moments only — class `.neon-gradient-text`):

`#0D40FF → #0C74E8 → #00BDFF → #00E5FF`

---

## Typography (canonical as of June 2026)

| Role | Font | Tailwind |
|------|------|----------|
| UI / body | **Poppins** | `font-sans` |
| Editorial headlines | Playfair Display | `font-serif` |
| Labels / metadata | JetBrains Mono | `font-mono` |

**Scale utilities:** `.headline-xl`, `.headline-lg` (fluid clamp in globals.css).  
**Kicker pattern:** `text-xs font-mono uppercase tracking-widest`

---

## Radius system (canonical as of June 2026)

**Neon glass surfaces** use soft radius (`rounded-xl` on `GlassCard`, `rounded-full` on pill chips/CTAs). **shadcn** inherits `--radius: 1rem` from globals. Sharp zero-radius is **not** the live public look — do not redesign toward flat SaaS rectangles unless explicitly requested.

---

## Component vocabulary (use in mocks)

| Component | Path | Use for |
|-----------|------|---------|
| `AppShell` | `components/ui/app-shell.tsx` | Page wrapper; `withNeonBackdrop` on public pages |
| `GlassCard` | `components/ui/glass-card.tsx` | Cards; `emphasis`, `interactive` |
| `WaterFrame` | `components/ui/water-frame.tsx` | Flyer / hero images |
| `NeonLink` / `NeonButton` | `components/ui/neon-link.tsx` | Primary CTAs |
| `OceanDivider` | `components/ui/ocean-divider.tsx` | Section transitions |
| `SectionTitle` | `components/ui/section-title.tsx` | Kicker + title blocks |
| `StarfieldBackground` | Root layout | Global depth |
| Logo | `public/vizb-logo.png` via `lib/brand-assets.ts` | **RGBA PNG required** |

**Avoid:** raw shadcn `Card`/`Button` on marketing heroes; random `brand-blue` utilities (legacy).

---

## Public routes → files

| Route | Primary files |
|-------|----------------|
| `/` | `app/page.tsx`, `components/home/home-redesign-hero.tsx`, `components/home/home-events-grid.tsx`, `components/home/home-experience-flow.tsx`, `components/app-preview.tsx`, `components/waitlist-section.tsx` |
| `/events` | `app/events/page.tsx`, `components/events/event-timeline-card.tsx` |
| `/events/[slug]` | `app/events/[slug]/page.tsx` |
| `/p` | `app/p/page.tsx`, `components/posts/post-card.tsx` |
| `/p/[slug]` | `app/p/[slug]/page.tsx` |
| `/advertise` | `app/advertise/page.tsx`, `components/advertise/advertise-contact-form.tsx` |
| `/lineup/[eventSlug]` | `app/lineup/[eventSlug]/page.tsx` |

**Homepage section order:** Navbar -> redesigned hero -> event grid -> experience flow -> app preview -> waitlist -> footer (`OceanDivider` between major bands).

---

## Screenshots for visual reference

Captured PNGs (regenerate anytime):

```bash
npm run redesign:screenshots
```

Output directory: [`docs/redesign/screenshots/`](redesign/screenshots/)

| File | Route |
|------|--------|
| `home-desktop.png` | `/` |
| `events-desktop.png` | `/events` |

See [`docs/redesign/README.md`](redesign/README.md) for viewport notes and manual capture fallback.

---

## Constraints for external designers

1. **Not a rebrand** — deepen ocean/neon/glass, do not flatten to generic SaaS.
2. **No new UI libraries** unless explicitly approved.
3. Gradient text only on **brand moments** (heroes, key titles, primary CTAs).
4. Real event photography only; credit photographers in mono.
5. Prefer extending existing primitives over page-level one-off CSS.

---

## Related docs index

- [`docs/BRAND_CONSTITUTION.md`](BRAND_CONSTITUTION.md) — non-negotiable laws
- [`docs/brand/VOICE_AND_MESSAGING.md`](brand/VOICE_AND_MESSAGING.md) — copy tone
- [`docs/IMPRESSION_PACKS.md`](IMPRESSION_PACKS.md) — ocean dividers, focus ring, interactive cards
- [`docs/REDESIGN_EXTERNAL_LLM_BRIEF.md`](REDESIGN_EXTERNAL_LLM_BRIEF.md) — prompts for mood boards & hierarchy proposals
