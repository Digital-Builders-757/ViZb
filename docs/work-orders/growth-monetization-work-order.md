# Work Order, ViZb Growth and Monetization

Related roadmap: `docs/plans/VIZb_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.

## Goal
Add revenue paths without making ViZb feel spammy or generic.

This is the later-stage monetization layer. Revenue should support the event ecosystem, not overwhelm it.

## Product decision
Treat monetization as a tasteful extension of the platform, not a separate sales product.

Focus on:
- featured placements
- sponsorship packages
- promotion slots
- newsletter or notification segments
- organizer upsell paths

## What to build

### Featured placement
- Support promoted or featured placements only if they can stay clearly labeled.
- Do not let paid placement blur the difference between official and community content.

### Sponsorship and packages
- Add sponsorship options or packages only where they fit existing admin/ops workflows.
- Keep the purchase or inquiry path simple.

### Organizer upsells
- Offer useful upgrades to organizers, such as promotion, featured placement, or premium visibility.
- Keep the upsell relevant to event success.

### Messaging and segments
- Use newsletter or notification segmentation where it adds value.
- Make promotional messaging feel useful to users.

## Implementation guidance
- Inspect current advertiser / sponsorship / promo surfaces first.
- Reuse existing contact, admin, and event surfaces where possible.
- Prefer minimal diff and existing primitives.
- Do not damage discovery quality for the sake of monetization.
- If schema, billing, or CRM changes are needed, update them safely and document them.

## Acceptance criteria
- Revenue paths exist and are clearly labeled.
- Monetization does not pollute the experience.
- Organizer upsells feel helpful.
- The UI stays aligned with the brand.
- Build passes.

## Suggested implementation order
1. Inspect existing sponsorship or advertiser surfaces.
2. Add the smallest useful revenue path.
3. Keep labeling and placement clear.
4. Verify it does not degrade discovery.
5. Document the change.

## Notes
- Monetization should support the community, not distract from it.
- If it feels pushy, it is probably wrong.

## Ship log
- **2026-05-05:** Shipped **inquiry-only** growth lane: `/advertise` transparency copy (paid vs editorial **Staff pick**); new **`organizer_promotion`** interest type; server-validated **`submissionContext`** referrer lines for organizer CTAs; **`OrganizerPartnershipUpsell`** on organizer home + published event detail (links to `/advertise?from=organizer` with optional `org` / `event`); removed misleading **$0 revenue** stat tile; contract update **`docs/contracts/sponsors.md`**.
