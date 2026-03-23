-- 017_event_review_metadata.sql
-- Adds 'rejected' status to event_status enum and review metadata columns.
-- IMPORTANT: Do NOT wrap in BEGIN/COMMIT — ALTER TYPE ADD VALUE cannot run inside a transaction.

-- 1) Add 'rejected' enum value
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2) Add review metadata columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text;

-- 3) Indexes for queue performance
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events(status);
CREATE INDEX IF NOT EXISTS events_reviewed_at_idx ON public.events(reviewed_at);
