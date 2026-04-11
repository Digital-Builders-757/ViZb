-- Stripe Checkout fulfillment: idempotent mint of registration + completed order + ticket
-- after payment. Invoked only from server-side webhook using service_role.

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_checkout_session_id_key
  ON public.orders (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON INDEX orders_stripe_checkout_session_id_key IS
  'At most one order per Stripe Checkout session (webhook idempotency).';

CREATE OR REPLACE FUNCTION public.fulfill_stripe_checkout_for_ticket(
  p_stripe_checkout_session_id text,
  p_user_id uuid,
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_amount_total_cents integer,
  p_currency text DEFAULT 'usd'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_id uuid;
  v_oid uuid;
  v_oi_id uuid;
  tt_event_id uuid;
  tt_price integer;
  tt_currency text;
  tt_capacity integer;
  tt_start timestamptz;
  tt_end timestamptz;
  ev_status text;
  ev_cap integer;
  occ integer;
  reg_id uuid;
  reg_status text;
  new_code text;
  attempts integer;
BEGIN
  IF p_stripe_checkout_session_id IS NULL OR length(trim(p_stripe_checkout_session_id)) < 8 THEN
    RAISE EXCEPTION 'Invalid checkout session id';
  END IF;

  IF p_amount_total_cents IS NULL OR p_amount_total_cents < 1 THEN
    RAISE EXCEPTION 'Invalid payment amount';
  END IF;

  PERFORM pg_advisory_xact_lock(884291, abs(hashtext(p_stripe_checkout_session_id)));

  SELECT t.id
  INTO v_ticket_id
  FROM public.tickets t
  INNER JOIN public.orders o ON o.id = t.order_id
  WHERE o.stripe_checkout_session_id = p_stripe_checkout_session_id
  LIMIT 1;

  IF v_ticket_id IS NOT NULL THEN
    RETURN v_ticket_id;
  END IF;

  SELECT
    tt.event_id,
    tt.price_cents,
    tt.currency,
    tt.capacity,
    tt.sales_starts_at,
    tt.sales_ends_at
  INTO tt_event_id, tt_price, tt_currency, tt_capacity, tt_start, tt_end
  FROM public.ticket_types tt
  WHERE tt.id = p_ticket_type_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket type not found';
  END IF;

  IF tt_event_id IS DISTINCT FROM p_event_id THEN
    RAISE EXCEPTION 'Ticket type does not belong to this event';
  END IF;

  IF tt_price IS NULL OR tt_price < 1 THEN
    RAISE EXCEPTION 'Ticket type is not a paid tier';
  END IF;

  IF tt_price IS DISTINCT FROM p_amount_total_cents THEN
    RAISE EXCEPTION 'Payment amount does not match ticket price';
  END IF;

  IF lower(coalesce(tt_currency, 'usd')) IS DISTINCT FROM lower(coalesce(p_currency, 'usd')) THEN
    RAISE EXCEPTION 'Currency mismatch';
  END IF;

  SELECT e.status, e.rsvp_capacity
  INTO ev_status, ev_cap
  FROM public.events e
  WHERE e.id = p_event_id;

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

  IF tt_capacity IS NOT NULL THEN
    SELECT COUNT(*)::int INTO occ
    FROM public.tickets t2
    INNER JOIN public.event_registrations er2 ON er2.id = t2.event_registration_id
    WHERE t2.ticket_type_id = p_ticket_type_id
      AND er2.status IN ('confirmed', 'checked_in');

    IF occ >= tt_capacity THEN
      RAISE EXCEPTION 'This ticket type is full'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  reg_id := NULL;
  reg_status := NULL;
  SELECT er.id, er.status INTO reg_id, reg_status
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id AND er.user_id = p_user_id;

  IF reg_id IS NOT NULL AND reg_status = 'checked_in' THEN
    RAISE EXCEPTION 'Already checked in for this event';
  END IF;

  IF reg_id IS NOT NULL AND reg_status IN ('confirmed', 'checked_in') THEN
    IF EXISTS (
      SELECT 1 FROM public.tickets tx WHERE tx.event_registration_id = reg_id LIMIT 1
    ) THEN
      RAISE EXCEPTION 'Already have a ticket for this event';
    END IF;
  END IF;

  INSERT INTO public.event_registrations (
    event_id,
    user_id,
    status,
    created_at,
    updated_at,
    cancelled_at,
    checked_in_at
  )
  VALUES (
    p_event_id,
    p_user_id,
    'confirmed',
    now(),
    now(),
    NULL,
    NULL
  )
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    status = 'confirmed',
    cancelled_at = NULL,
    checked_in_at = NULL,
    updated_at = now()
  RETURNING id INTO reg_id;

  IF reg_id IS NULL THEN
    RAISE EXCEPTION 'Could not upsert registration';
  END IF;

  v_oid := NULL;
  SELECT o.id INTO v_oid
  FROM public.orders o
  WHERE o.stripe_checkout_session_id = p_stripe_checkout_session_id
  LIMIT 1;

  IF v_oid IS NULL THEN
    INSERT INTO public.orders (
      user_id,
      status,
      total_cents,
      currency,
      stripe_checkout_session_id,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      'completed',
      p_amount_total_cents,
      lower(coalesce(p_currency, 'usd')),
      p_stripe_checkout_session_id,
      now(),
      now()
    )
    RETURNING id INTO v_oid;
  END IF;

  v_oi_id := NULL;
  SELECT oi.id INTO v_oi_id
  FROM public.order_items oi
  WHERE oi.order_id = v_oid AND oi.ticket_type_id = p_ticket_type_id
  LIMIT 1;

  IF v_oi_id IS NULL THEN
    INSERT INTO public.order_items (
      order_id,
      ticket_type_id,
      quantity,
      unit_price_cents,
      line_total_cents
    )
    VALUES (
      v_oid,
      p_ticket_type_id,
      1,
      tt_price,
      tt_price
    )
    RETURNING id INTO v_oi_id;
  END IF;

  SELECT t.id INTO v_ticket_id
  FROM public.tickets t
  WHERE t.order_id = v_oid
  LIMIT 1;

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
        order_id,
        order_item_id,
        ticket_type_id,
        event_id,
        user_id,
        event_registration_id,
        ticket_code
      )
      VALUES (
        v_oid,
        v_oi_id,
        p_ticket_type_id,
        p_event_id,
        p_user_id,
        reg_id,
        new_code
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

REVOKE ALL ON FUNCTION public.fulfill_stripe_checkout_for_ticket(text, uuid, uuid, uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_stripe_checkout_for_ticket(text, uuid, uuid, uuid, integer, text) TO service_role;
