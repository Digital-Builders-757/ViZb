# Journey: host / organizer creates event

**Status:** STUB  
**Routes:** `/organizer/new`, `/organizer/[slug]/events/new`, …

## Happy path

1. Organizer has org context.  
2. Creates draft event with required fields + flyer.  
3. Submits for review if required; sees status on dashboard.

## Acceptance

- RLS prevents cross-org edits; admin sees item in review queue when applicable.
