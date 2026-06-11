# Performance

**Last updated:** June 7, 2026

Benchmarks and optimization notes. Root snapshot: **`PERFORMANCE_REPORT.md`** (repo root).

## `/events` first-visit pass (June 2026)

| Issue | Why it was slow | Change | Expected effect |
|-------|-----------------|--------|-----------------|
| Three.js particle background | ~800 WebGL particles + dynamic import still ran on every `/events` visit | Replaced with static CSS radial gradients; orbs retained | Lower main-thread and GPU work on first paint |
| Unbounded event query | Fetched all published events from 30-day cutoff with no limit | Added `.limit(120)` on listing query | Smaller payload, faster TTFB on large catalogs |
| Duplicate Supabase client | Two `createClient()` calls per request (events + auth/saves) | Single client reused for events + auth + saves | One session refresh path per request |
| Interactive timeline cards | Each `EventTimelineCard` hydrated tilt/glare (`GlassCardInteractive`) | `interactive={false}` on `/events` and home timeline | Fewer client listeners per row |
| Loading skeleton mismatch | `app/events/loading.tsx` used generic theme tokens | Aligned skeleton with neon tokens / layout | Less visual flash after navigation |

## Logging vs performance

Scoped server logs (`lib/log.ts`) add negligible overhead; use them for failure diagnosis without enabling verbose client logging.

## Visual performance budgets (#170)

| Surface | Budget | Check |
|---------|--------|-------|
| `/` LCP | < 2.5s mobile | Hero uses CSS caustic until WebGL loads; no blocking canvas |
| `/events` first visit | No WebGL | `CausticBackdrop` editorial variant only |
| `/events/[slug]` | CLS < 0.1 | `EventPremiumFlyer` reserves 4:5 aspect |
| Dashboard | No extra WebGL | `control-room` caustic + existing aurora |
| Immersive effects | Reduced motion | `prefers-reduced-motion` disables caustic drift + enter animations |

**Regression capture:** `npm run redesign:screenshots` (Playwright) — home, events, dashboard, sample event detail at 1440×900 and 390×844.

## Follow-ups (not in this pass)

- Enable Next.js image optimization when Supabase transform URLs are confirmed (`next.config.mjs` currently has `images.unoptimized: true`).
- Dedupe **`/events/[slug]`** metadata + page fetch via `React.cache()`.
- Consider streaming rails vs timeline with extracted server components.
