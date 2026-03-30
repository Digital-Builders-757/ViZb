# Contract: events

**Status:** STUB  
**Spec:** `docs/VIBE_APP_SPECIFICATION.md` (events schema + RLS)  
**Layer 1:** `docs/EVENTS_SOURCE_OF_TRUTH.md`  
**Code:** `app/actions/event.ts`, `app/events/**`, `app/(dashboard)/organizer/**`, admin review UI

## Invariants

- Event visibility follows **status + RLS**; public routes are Manifest reads only.  
- Mutations go through Server Actions; explicit `select` lists.

## Lifecycle

Align enum/status values with executed SQL; document transitions here when stable.
