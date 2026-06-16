-- Stripe webhook hardening: idempotent event ledger + order refund/dispute/payout guard fields.

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  result text NOT NULL DEFAULT 'processed'
    CHECK (result IN ('processed', 'skipped', 'failed')),
  error_message text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_order_id
  ON public.processed_stripe_events(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_type
  ON public.processed_stripe_events(event_type);

ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "processed_stripe_events_staff_select" ON public.processed_stripe_events;
CREATE POLICY "processed_stripe_events_staff_select" ON public.processed_stripe_events
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS dispute_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payout_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_blocked_reason text,
  ADD COLUMN IF NOT EXISTS payout_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_charge_id text;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_refund_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_refund_status_check
  CHECK (refund_status IN ('none', 'pending', 'partial', 'full'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_dispute_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_dispute_status_check
  CHECK (dispute_status IN ('none', 'open', 'won', 'lost', 'warning_closed'));

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_charge_id_key
  ON public.orders (stripe_charge_id)
  WHERE stripe_charge_id IS NOT NULL;

COMMENT ON TABLE public.processed_stripe_events IS
  'Idempotency ledger for Stripe webhooks; one row per stripe_event_id.';

COMMENT ON COLUMN public.orders.payout_blocked IS
  'When true, organizer payout must not proceed (refund/dispute guard until released).';

COMMENT ON COLUMN public.orders.payout_released_at IS
  'When set, payout was released; refund webhooks cannot retroactively block.';
