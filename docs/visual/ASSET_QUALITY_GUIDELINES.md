# Visual asset quality guidelines

**Related:** [`VIZB_UNDERWATER_SYSTEM_2.md`](./VIZB_UNDERWATER_SYSTEM_2.md)

## Event flyers

- **Aspect:** 4:5 preferred (matches `EventPremiumFlyer` / timeline cards).
- **Min width:** 800px for crisp timeline + detail; 1200px+ for hero rails.
- **Format:** JPG or WebP; avoid PNG for photo-heavy art unless transparency required.
- **Safe zone:** Keep title/date out of bottom 15% (gradient overlay sits there on detail).
- **Fallback:** Missing flyer uses branded date glyph — do not ship empty gray boxes.

## Real photography (marketing / about)

- Apply scrim when text sits on photo (`opacity-30` max under copy).
- Prefer Virginia/DMV cultural context; avoid generic stock that breaks brand tone.
- **Contrast:** 4.5:1 minimum for any text over image.

## Logos and wordmark

- Canonical wordmark: `/vizb-logo.png` — do not stretch or recolor outside token palette.
- Minimum clear space: height of the “V” on all sides.

## Disallowed

- Uncompressed 5MB+ flyers on listing cards.
- Neon glow baked into source PNG (use CSS glow instead).
- Mixed aspect ratios in the same rail without `object-cover` + fixed frame.

## QA checklist (per asset PR)

1. Renders in `WaterFrame` / `EventPremiumFlyer` without letterboxing glitches  
2. Readable at mobile timeline width  
3. No horizontal overflow on `/events`  
4. Lighthouse does not flag oversized image payload on touched routes  
