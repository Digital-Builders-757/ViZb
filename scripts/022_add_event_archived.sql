-- Migration 022: Add archived status for events (soft-delete)
-- Non-destructive: add enum value only.

ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'archived';
