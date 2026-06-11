-- Member culture preferences for personalization, reminders, and onboarding (#154).

CREATE TABLE IF NOT EXISTS public.member_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  home_cities text[] NOT NULL DEFAULT '{}',
  categories text[] NOT NULL DEFAULT '{}',
  reminder_opt_in boolean NOT NULL DEFAULT true,
  email_reminders boolean NOT NULL DEFAULT true,
  in_app_reminders boolean NOT NULL DEFAULT true,
  onboarding_completed_at timestamptz,
  vibe_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_preferences_home_cities_nonempty CHECK (cardinality(home_cities) <= 12),
  CONSTRAINT member_preferences_categories_nonempty CHECK (cardinality(categories) <= 12),
  CONSTRAINT member_preferences_vibe_tags_cap CHECK (cardinality(vibe_tags) <= 24)
);

CREATE INDEX IF NOT EXISTS idx_member_preferences_onboarding
  ON public.member_preferences (onboarding_completed_at);

ALTER TABLE public.member_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_preferences_select_own" ON public.member_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "member_preferences_insert_own" ON public.member_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "member_preferences_update_own" ON public.member_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS member_preferences_set_updated_at ON public.member_preferences;
CREATE TRIGGER member_preferences_set_updated_at
BEFORE UPDATE ON public.member_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.member_preferences IS
  'Per-member culture profile: cities, categories, reminder channels, onboarding state.';
