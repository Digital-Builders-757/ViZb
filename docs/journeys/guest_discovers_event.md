# Journey: guest discovers event

**Status:** MVP  
**Manifest:** `/`, `/events`, `/events/[slug]`

## Happy path

1. Guest opens **`/events`** — browse chips (categories + **My Vibes**), time presets (**Tonight**, **This weekend**, **Free**, etc.), keyword search (**GET `q`**), optional **Soonest / By city** sort.
2. Curated rails appear above the timeline when data exists:
   - **Starting soon** — official events first (hero + compact cards)
   - **ViZb picks** — staff editorial highlights
   - **Local & community** — community-submitted listings not already featured above
3. Full **timeline** below (`#timeline`) with date headers and flyer-forward cards.
4. Opens event detail; sees accurate title, time, venue text, CTA (sign in to RSVP / get tickets when available; community listings use external RSVP in a new tab).

## Acceptance

- No auth wall for public catalog unless product explicitly requires it.  
- **My Vibes** (`?vibes=1`) requires sign-in for the timeline; discovery rails still show for signed-out guests.
- Content matches DB-backed fields; no invented lineup/price.
- Supabase query failures show an **Events couldn't load** banner (not a false empty catalog).

## Performance notes (first visit)

- **`/events`** uses a static CSS backdrop instead of Three.js for faster first paint.
- Timeline cards disable interactive tilt on listing pages to reduce client hydration cost.
