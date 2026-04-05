-- Align RSVP status with timestamp columns so rows cannot drift (e.g. cancelled without cancelled_at).
-- Run the verification queries in docs/database/EVENT_REGISTRATIONS_AUDIT.md before applying in production.

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_cancelled_requires_cancelled_at
  CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL);

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_checked_in_requires_checked_in_at
  CHECK (status <> 'checked_in' OR checked_in_at IS NOT NULL);

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_confirmed_clears_status_timestamps
  CHECK (
    status <> 'confirmed'
    OR (cancelled_at IS NULL AND checked_in_at IS NULL)
  );
