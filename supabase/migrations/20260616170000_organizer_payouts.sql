-- M8: Organizer payout ledger rows (separate charges + transfers).
-- One payout record per paid order; released after event end + configured delay.

CREATE TABLE IF NOT EXISTS public.organizer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  stripe_connected_account_id text,
  organizer_payout_cents integer NOT NULL,
  vizb_service_fee_cents integer NOT NULL,
  processing_fee_cents integer NOT NULL,
  buyer_total_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'blocked', 'releasing', 'released', 'failed')),
  available_on timestamptz NOT NULL,
  stripe_transfer_id text,
  blocked_reason text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizer_payouts_order_id_key UNIQUE (order_id),
  CONSTRAINT organizer_payouts_stripe_transfer_id_key UNIQUE (stripe_transfer_id),
  CONSTRAINT organizer_payouts_amounts_non_negative CHECK (
    organizer_payout_cents >= 0
    AND vizb_service_fee_cents >= 0
    AND processing_fee_cents >= 0
    AND buyer_total_cents >= 0
    AND buyer_total_cents = organizer_payout_cents + vizb_service_fee_cents + processing_fee_cents
  )
);

CREATE INDEX IF NOT EXISTS idx_organizer_payouts_release_pending
  ON public.organizer_payouts (available_on ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_organizer_payouts_organizer_id
  ON public.organizer_payouts (organizer_id);

ALTER TABLE public.organizer_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizer_payouts_select_own ON public.organizer_payouts;
CREATE POLICY organizer_payouts_select_own ON public.organizer_payouts
  FOR SELECT TO authenticated
  USING (organizer_id = (SELECT auth.uid()));

COMMENT ON TABLE public.organizer_payouts IS
  'Organizer Connect payout ledger: created when an order is paid, released via Stripe transfer after event end + delay.';

COMMENT ON COLUMN public.organizer_payouts.available_on IS
  'Earliest timestamp payout may be released (event end + ViZb payout delay).';

COMMENT ON COLUMN public.organizer_payouts.status IS
  'pending | blocked | releasing | released | failed';

-- Writes via service role in fulfillment, webhooks, and release job only.
