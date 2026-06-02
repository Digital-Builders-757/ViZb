# External LLM brief — ViZb public UI redesign

Copy sections below into ChatGPT, Claude, Gemini, or Figma AI. Attach [`docs/REDESIGN_HANDOFF.md`](REDESIGN_HANDOFF.md) and screenshots from `docs/redesign/screenshots/` when available.

---

## Prompt 1 — Mood board & north star

```
You are a creative director for ViZb, a Virginia events & community platform.

Visual north star (KEEP):
- Underwater / oceanic atmosphere (starfield, caustic section dividers)
- Neon glass surfaces (frosted panels, hairline borders, cyan #00d1ff / violet #9d4dff / magenta #ff4ecd)
- Cinematic near-black backgrounds (#05050a)
- Editorial typography: Playfair Display headlines, Poppins UI body, JetBrains Mono uppercase kickers
- Flyer-first event presentation, restrained glow motion

AVOID:
- Generic AI SaaS dashboards, stock photos, emoji, rainbow status pills
- Flattening to default Material/shadcn look
- Gradient fills on cards (gradient text only on hero/key titles)

Deliver:
1. Mood board description (5–8 bullet visual references — brands/scenes, not code)
2. 3 hierarchy principles for homepage and /events
3. One paragraph "what we will NOT change"
```

---

## Prompt 2 — Homepage section hierarchy

```
Given ViZb homepage order:
Navbar → Hero (Three.js bg) → Marquee → Editorial grid (#about) → Events → Latest posts → App preview → Waitlist → Footer

For each section, output a table:
| Section | Current job | Proposed visual priority (1-5) | Copy/CTA tweak | Component to use (GlassCard, WaterFrame, OceanDivider, NeonLink, SectionTitle) |
| Section | Mobile risk | One concrete improvement |

Constraints: not a rebrand; neon glass editorial; public marketing scope only.
```

---

## Prompt 3 — Events discovery & show pages

```
Design critique for:
- /events (timeline discovery)
- /events/[slug] (event "show page" — flyer + metadata + RSVP)

Output:
1. Hero/header rhythm recommendations
2. Chip/badge system (categories, staff pick, community vs official)
3. Image overlay recipe for flyers
4. CTA hierarchy (RSVP vs My Vibes vs Share)
5. Mobile layout notes

Reference tokens: --neon-a/b/c, GlassCard, WaterFrame, vibe-cta-gradient.
```

---

## Prompt 4 — Posts & partnerships editorial

```
ViZb /p (posts index) and /advertise (partnerships form) should feel as premium as /events, not flatter.

Propose:
- Posts index header treatment (kicker + title — gradient yes/no?)
- Post card grid density vs editorial single-column on detail
- Advertise page: hero (WaterFrame) + form (GlassCard) flow improvements
- Empty states copy tone (bold, inclusive, no corporate jargon)

Return wireframe descriptions only (no code).
```

---

## Deliverables checklist (for you + external LLM)

- [ ] Mood board notes (Prompt 1)
- [ ] Homepage section table (Prompt 2)
- [ ] Events/show page critique (Prompt 3)
- [ ] Posts/advertise wireframe notes (Prompt 4)
- [ ] Decision: confirm Poppins + glass radius (already canonical in BRAND_SYSTEM June 2026)

After approval, implementation happens in-repo via `globals.css` + `GlassCard` / `NeonLink` primitives (Cursor agent).
