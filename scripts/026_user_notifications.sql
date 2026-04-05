-- Mirror of supabase/migrations/20260405190000_user_notifications.sql (manual apply / reference).

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id_created_at
  ON public.user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
  ON public.user_notifications(user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notifications_select_own" ON public.user_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_notifications_update_own" ON public.user_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notifications_insert_staff" ON public.user_notifications
  FOR INSERT TO authenticated
  WITH CHECK (is_staff_admin());
