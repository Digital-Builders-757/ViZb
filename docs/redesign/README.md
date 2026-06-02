# Redesign assets

Supporting files for [`docs/REDESIGN_HANDOFF.md`](../REDESIGN_HANDOFF.md).

## Screenshots

| Command | Output |
|---------|--------|
| `npm run redesign:screenshots` | `docs/redesign/screenshots/*.png` |

Requires dev server (Playwright starts `npm run dev` automatically). Uses mocked Supabase env like other E2E tests.

### Manual fallback

1. `npm run dev`
2. Open `http://localhost:3000/` and `http://localhost:3000/events`
3. Save full-page or above-the-fold captures into `docs/redesign/screenshots/` as `home-desktop.png` and `events-desktop.png`

Recommended viewport: **1440×900** desktop.
