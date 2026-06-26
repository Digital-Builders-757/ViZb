-- Signup capture: phone (required at signup) and optional referral source on profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS referral_source text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_referral_source_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_referral_source_check
  CHECK (referral_source IS NULL OR referral_source IN ('social_media', 'google'));

COMMENT ON COLUMN public.profiles.phone_number IS 'Phone collected at signup (required on /signup form).';
COMMENT ON COLUMN public.profiles.referral_source IS 'Optional signup attribution: social_media or google.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone_number, referral_source)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NULL),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'phone_number'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'referral_source'), '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
