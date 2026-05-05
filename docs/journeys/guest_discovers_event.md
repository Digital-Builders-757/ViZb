# Journey: guest discovers event

**Status:** STUB  
**Manifest:** `/`, `/events`, `/events/[slug]`

## Happy path

1. Guest opens **`/events`** — category chips, discovery presets (**Tonight**, **This weekend**, **Free**, etc.), keyword search (**GET `q`**), optional **Soonest / By city** sort, curated **Starting soon** + **Local & community** rails, then full timeline.  
2. Sees flyer-forward cards and clear date/city; **ViZb Event** vs **Local Event** is obvious on cards/detail.  
3. Opens event detail; sees accurate title, time, venue text, CTA (sign in to RSVP / get tickets when available; community listings use external RSVP in a new tab).

## Acceptance

- No auth wall for public catalog unless product explicitly requires it.  
- Content matches DB-backed fields; no invented lineup/price.
