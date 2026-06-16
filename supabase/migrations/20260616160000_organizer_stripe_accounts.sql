-- Stripe Connect Express: organizer payout accounts (one row per organizer user).

CREATE TABLE IF NOT EXISTS public.organizer_stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  onboarding_status text NOT NULL DEFAULT 'pending'
    CHECK (onboarding_status IN ('not_started', 'pending', 'restricted', 'active')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizer_stripe_accounts_organizer_id_key UNIQUE (organizer_id),
  CONSTRAINT organizer_stripe_accounts_stripe_account_id_key UNIQUE (stripe_account_id)
);

CREATE INDEX IF NOT EXISTS idx_organizer_stripe_accounts_onboarding_status
  ON public.organizer_stripe_accounts(onboarding_status);

ALTER TABLE public.organizer_stripe_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizer_stripe_accounts_select_own ON public.organizer_stripe_accounts;
CREATE POLICY organizer_stripe_accounts_select_own ON public.organizer_stripe_accounts
  FOR SELECT TO authenticated
  USING (organizer_id = (SELECT auth.uid()));

COMMENT ON TABLE public.organizer_stripe_accounts IS
  'Stripe Connect Express accounts for event organizers (organizer_id = auth user id / events.created_by).';

COMMENT ON COLUMN public.organizer_stripe_accounts.organizer_id IS
  'ViZb organizer user id; matches events.created_by for payout eligibility.';

COMMENT ON COLUMN public.organizer_stripe_accounts.onboarding_status IS
  'Derived lifecycle: not_started | pending | restricted | active (payout-ready when active).';

-- Writes happen via service role in server actions and Stripe webhooks only.
