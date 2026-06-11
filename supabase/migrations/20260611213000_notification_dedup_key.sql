-- Dedup keys for automated reminders (#156) — one row per user + logical reminder.

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS dedup_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_notifications_user_dedup
  ON public.user_notifications (user_id, dedup_key)
  WHERE dedup_key IS NOT NULL;

COMMENT ON COLUMN public.user_notifications.dedup_key IS
  'Idempotency key for cron-generated reminders (e.g. saved:24h:{event_id}).';
