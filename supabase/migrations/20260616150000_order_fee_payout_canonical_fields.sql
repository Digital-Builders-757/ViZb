-- M3: Canonical order fee breakdown + payment/payout lifecycle fields for Connect readiness.
-- Keeps legacy subtotal_cents / platform_fee_cents / total_cents in sync via trigger.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ticket_subtotal_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vizb_service_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_total_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS organizer_payout_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'not_required';

-- Backfill canonical money columns from legacy names.
UPDATE public.orders
SET
  ticket_subtotal_cents = COALESCE(NULLIF(ticket_subtotal_cents, 0), subtotal_cents, 0),
  vizb_service_fee_cents = COALESCE(NULLIF(vizb_service_fee_cents, 0), platform_fee_cents, 0),
  buyer_total_cents = COALESCE(NULLIF(buyer_total_cents, 0), total_cents, 0),
  organizer_payout_cents = COALESCE(
    NULLIF(organizer_payout_cents, 0),
    subtotal_cents,
    ticket_subtotal_cents,
    0
  )
WHERE ticket_subtotal_cents = 0
   OR buyer_total_cents = 0
   OR organizer_payout_cents = 0
   OR vizb_service_fee_cents = 0;

UPDATE public.orders
SET organizer_payout_cents = ticket_subtotal_cents
WHERE organizer_payout_cents = 0
  AND ticket_subtotal_cents > 0;

-- payment_status backfill from legacy orders.status + Stripe refs.
UPDATE public.orders
SET payment_status = CASE
  WHEN status = 'completed' THEN 'paid'
  WHEN status = 'failed' THEN 'failed'
  WHEN status IN ('cancelled', 'expired') THEN 'canceled'
  WHEN status = 'pending_payment' AND stripe_checkout_session_id IS NOT NULL THEN 'checkout_started'
  WHEN status = 'pending_payment' THEN 'created'
  WHEN status = 'refunded' THEN 'paid'
  ELSE 'created'
END
WHERE payment_status = 'created'
  AND (
    status <> 'pending_payment'
    OR stripe_checkout_session_id IS NOT NULL
    OR subtotal_cents = 0
  );

-- payout_status backfill.
UPDATE public.orders
SET payout_status = CASE
  WHEN ticket_subtotal_cents = 0 AND buyer_total_cents = 0 THEN 'not_required'
  WHEN payout_released_at IS NOT NULL THEN 'released'
  WHEN payout_blocked THEN 'blocked'
  WHEN status = 'completed' AND ticket_subtotal_cents > 0 THEN 'pending'
  WHEN ticket_subtotal_cents > 0 AND status IN ('pending_payment', 'failed', 'cancelled', 'expired') THEN 'pending'
  ELSE 'not_required'
END
WHERE payout_status = 'not_required'
  AND ticket_subtotal_cents > 0;

-- Align dispute vocabulary: open -> disputed (Stripe Connect lifecycle).
UPDATE public.orders
SET dispute_status = 'disputed'
WHERE dispute_status = 'open';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_dispute_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_dispute_status_check
  CHECK (dispute_status IN ('none', 'disputed', 'won', 'lost', 'pending', 'warning_closed'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('created', 'checkout_started', 'paid', 'failed', 'canceled'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payout_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payout_status_check
  CHECK (payout_status IN ('not_required', 'pending', 'blocked', 'released', 'failed'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_amounts_non_negative;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_amounts_non_negative
  CHECK (
    ticket_subtotal_cents >= 0
    AND vizb_service_fee_cents >= 0
    AND processing_fee_cents >= 0
    AND buyer_total_cents >= 0
    AND organizer_payout_cents >= 0
    AND subtotal_cents >= 0
    AND platform_fee_cents >= 0
    AND total_cents >= 0
    AND buyer_total_cents = ticket_subtotal_cents + vizb_service_fee_cents + processing_fee_cents
    AND subtotal_cents = ticket_subtotal_cents
    AND platform_fee_cents = vizb_service_fee_cents
    AND total_cents = buyer_total_cents
    AND organizer_payout_cents <= ticket_subtotal_cents
  );

CREATE OR REPLACE FUNCTION public.orders_sync_fee_and_legacy_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.ticket_subtotal_cents := COALESCE(NEW.ticket_subtotal_cents, NEW.subtotal_cents, 0);
  NEW.vizb_service_fee_cents := COALESCE(NEW.vizb_service_fee_cents, NEW.platform_fee_cents, 0);
  NEW.processing_fee_cents := COALESCE(NEW.processing_fee_cents, 0);
  NEW.buyer_total_cents := COALESCE(NEW.buyer_total_cents, NEW.total_cents, 0);
  NEW.organizer_payout_cents := COALESCE(NEW.organizer_payout_cents, NEW.ticket_subtotal_cents, 0);

  NEW.subtotal_cents := NEW.ticket_subtotal_cents;
  NEW.platform_fee_cents := NEW.vizb_service_fee_cents;
  NEW.total_cents := NEW.buyer_total_cents;

  IF NEW.ticket_subtotal_cents = 0 AND NEW.buyer_total_cents = 0 AND NEW.status = 'completed' THEN
    NEW.payment_status := 'paid';
    NEW.payout_status := 'not_required';
  ELSIF NEW.ticket_subtotal_cents > 0 AND NEW.status = 'completed' AND NEW.payout_status = 'not_required' THEN
    NEW.payout_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_sync_fee_and_legacy_columns ON public.orders;

CREATE TRIGGER orders_sync_fee_and_legacy_columns
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_sync_fee_and_legacy_columns();

COMMENT ON COLUMN public.orders.ticket_subtotal_cents IS
  'Face-value ticket total in cents (organizer share before ViZb/processing fees).';

COMMENT ON COLUMN public.orders.vizb_service_fee_cents IS
  'ViZb service fee in cents (5% + $1/ticket at launch).';

COMMENT ON COLUMN public.orders.processing_fee_cents IS
  'Card processing fee passed through to buyer, in cents.';

COMMENT ON COLUMN public.orders.buyer_total_cents IS
  'Total charged to buyer in cents (ticket + ViZb fee + processing).';

COMMENT ON COLUMN public.orders.organizer_payout_cents IS
  'Amount owed to organizer at payout time; equals ticket face value for paid tiers.';

COMMENT ON COLUMN public.orders.payment_status IS
  'Buyer payment lifecycle: created → checkout_started → paid | failed | canceled.';

COMMENT ON COLUMN public.orders.payout_status IS
  'Organizer Connect payout lifecycle: not_required | pending | blocked | released | failed.';

-- Paid Stripe fulfillment: validate buyer_total_cents and set payment/payout statuses.
CREATE OR REPLACE FUNCTION public.fulfill_stripe_ticket_order(
  p_order_id uuid,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text DEFAULT NULL,
  p_amount_total_cents integer DEFAULT NULL,
  p_currency text DEFAULT 'usd'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_id uuid;
  v_order public.orders%ROWTYPE;
  v_order_item public.order_items%ROWTYPE;
  tt_event_id uuid;
  tt_price integer;
  tt_currency text;
  tt_capacity integer;
  tt_start timestamptz;
  tt_end timestamptz;
  tt_active boolean;
  ev_status text;
  ev_cap integer;
  occ integer;
  reg_id uuid;
  reg_status text;
  new_code text;
  attempts integer;
  user_email text;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'Order id is required';
  END IF;

  IF p_stripe_checkout_session_id IS NULL OR length(trim(p_stripe_checkout_session_id)) < 8 THEN
    RAISE EXCEPTION 'Invalid checkout session id';
  END IF;

  PERFORM pg_advisory_xact_lock(884292, abs(hashtext(p_order_id::text)));

  SELECT * INTO v_order FROM public.orders o WHERE o.id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT * INTO v_order_item
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
  ORDER BY oi.created_at ASC, oi.id ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item not found';
  END IF;

  IF v_order.status = 'completed' THEN
    SELECT t.id INTO v_ticket_id FROM public.tickets t WHERE t.order_id = p_order_id LIMIT 1;
    IF v_ticket_id IS NOT NULL THEN
      RETURN v_ticket_id;
    END IF;
  END IF;

  IF v_order.status NOT IN ('pending_payment', 'completed') THEN
    RAISE EXCEPTION 'Order is not pending payment';
  END IF;

  IF v_order.event_id IS NULL THEN
    RAISE EXCEPTION 'Order event is missing';
  END IF;

  IF p_amount_total_cents IS NOT NULL AND p_amount_total_cents <> v_order.buyer_total_cents THEN
    RAISE EXCEPTION 'Payment amount does not match order total';
  END IF;

  IF lower(coalesce(v_order.currency, 'usd')) IS DISTINCT FROM lower(coalesce(p_currency, 'usd')) THEN
    RAISE EXCEPTION 'Currency mismatch';
  END IF;

  SELECT tt.event_id, tt.price_cents, tt.currency,
         COALESCE(tt.quantity_total, tt.capacity),
         COALESCE(tt.sales_start_at, tt.sales_starts_at),
         COALESCE(tt.sales_end_at, tt.sales_ends_at),
         COALESCE(tt.is_active, true)
  INTO tt_event_id, tt_price, tt_currency, tt_capacity, tt_start, tt_end, tt_active
  FROM public.ticket_types tt
  WHERE tt.id = v_order_item.ticket_type_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket type not found';
  END IF;

  IF tt_event_id IS DISTINCT FROM v_order.event_id THEN
    RAISE EXCEPTION 'Ticket type does not belong to order event';
  END IF;

  IF NOT tt_active THEN
    RAISE EXCEPTION 'Ticket type is inactive';
  END IF;

  IF tt_price IS DISTINCT FROM v_order.ticket_subtotal_cents THEN
    RAISE EXCEPTION 'Order subtotal does not match ticket price';
  END IF;

  IF lower(coalesce(tt_currency, 'usd')) IS DISTINCT FROM lower(coalesce(v_order.currency, 'usd')) THEN
    RAISE EXCEPTION 'Ticket currency mismatch';
  END IF;

  SELECT e.status, e.rsvp_capacity INTO ev_status, ev_cap FROM public.events e WHERE e.id = v_order.event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF ev_status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'Event is not published';
  END IF;

  IF tt_start IS NOT NULL AND now() < tt_start THEN
    RAISE EXCEPTION 'Ticket type is not on sale yet';
  END IF;

  IF tt_end IS NOT NULL AND now() > tt_end THEN
    RAISE EXCEPTION 'Ticket type sales have ended';
  END IF;

  IF ev_cap IS NOT NULL THEN
    SELECT public.published_event_rsvp_occupied_count(v_order.event_id) INTO occ;
    IF occ >= ev_cap THEN
      RAISE EXCEPTION 'This event is at capacity';
    END IF;
  END IF;

  IF tt_capacity IS NOT NULL THEN
    SELECT COUNT(*)::int INTO occ
    FROM public.tickets t2
    INNER JOIN public.event_registrations er2 ON er2.id = t2.event_registration_id
    WHERE t2.ticket_type_id = v_order_item.ticket_type_id
      AND t2.status IN ('active', 'checked_in')
      AND er2.status IN ('confirmed', 'checked_in');

    IF occ >= tt_capacity THEN
      RAISE EXCEPTION 'This ticket type is full' USING ERRCODE = '23514';
    END IF;
  END IF;

  reg_id := NULL;
  reg_status := NULL;
  SELECT er.id, er.status INTO reg_id, reg_status
  FROM public.event_registrations er
  WHERE er.event_id = v_order.event_id AND er.user_id = v_order.user_id;

  IF reg_id IS NOT NULL AND reg_status = 'checked_in' THEN
    RAISE EXCEPTION 'Already checked in for this event';
  END IF;

  IF reg_id IS NOT NULL AND reg_status IN ('confirmed', 'checked_in') THEN
    IF EXISTS (SELECT 1 FROM public.tickets tx WHERE tx.event_registration_id = reg_id LIMIT 1) THEN
      RAISE EXCEPTION 'Already have a ticket for this event';
    END IF;
  END IF;

  INSERT INTO public.event_registrations (event_id, user_id, status, created_at, updated_at, cancelled_at, checked_in_at)
  VALUES (v_order.event_id, v_order.user_id, 'confirmed', now(), now(), NULL, NULL)
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    status = 'confirmed',
    cancelled_at = NULL,
    checked_in_at = NULL,
    updated_at = now()
  RETURNING id INTO reg_id;

  SELECT u.email INTO user_email FROM auth.users u WHERE u.id = v_order.user_id;

  UPDATE public.orders
  SET status = 'completed',
      payment_status = 'paid',
      payout_status = CASE
        WHEN ticket_subtotal_cents > 0 THEN 'pending'
        ELSE 'not_required'
      END,
      stripe_checkout_session_id = p_stripe_checkout_session_id,
      stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
      updated_at = now()
  WHERE id = p_order_id;

  SELECT t.id INTO v_ticket_id FROM public.tickets t WHERE t.order_id = p_order_id LIMIT 1;

  IF v_ticket_id IS NOT NULL THEN
    RETURN v_ticket_id;
  END IF;

  attempts := 0;
  LOOP
    attempts := attempts + 1;
    IF attempts > 25 THEN
      RAISE EXCEPTION 'Could not allocate ticket_code';
    END IF;

    new_code := encode(extensions.gen_random_bytes(8), 'hex');

    BEGIN
      INSERT INTO public.tickets (
        order_id, order_item_id, ticket_type_id, event_id, user_id,
        event_registration_id, ticket_code, attendee_email, qr_code_token, status, checked_in_at
      )
      VALUES (
        p_order_id, v_order_item.id, v_order_item.ticket_type_id, v_order.event_id, v_order.user_id,
        reg_id, new_code, user_email, new_code, 'active', NULL
      )
      RETURNING id INTO v_ticket_id;
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        NULL;
    END;
  END LOOP;

  RETURN v_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_stripe_ticket_order(uuid, text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_stripe_ticket_order(uuid, text, text, integer, text) TO service_role;
