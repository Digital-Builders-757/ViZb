-- Stripe ticketing MVP upgrade:
-- - add platform-fee-aware order fields
-- - add webhook event log table
-- - add inventory aliases / counters for ticket types
-- - extend ticket rows with attendee + QR metadata
-- - make free RSVP + Stripe fulfillment write the richer schema

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS subtotal_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_cents integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_payment_intent_id_key
  ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment', 'completed', 'cancelled', 'expired', 'failed', 'refunded'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_amounts_non_negative;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_amounts_non_negative
  CHECK (
    subtotal_cents >= 0
    AND platform_fee_cents >= 0
    AND total_cents >= 0
    AND total_cents = subtotal_cents + platform_fee_cents
  );

ALTER TABLE public.ticket_types
  ADD COLUMN IF NOT EXISTS quantity_total integer,
  ADD COLUMN IF NOT EXISTS quantity_sold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS sales_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.ticket_types
  DROP CONSTRAINT IF EXISTS ticket_types_quantity_total_positive;

ALTER TABLE public.ticket_types
  ADD CONSTRAINT ticket_types_quantity_total_positive
  CHECK (quantity_total IS NULL OR quantity_total > 0);

ALTER TABLE public.ticket_types
  DROP CONSTRAINT IF EXISTS ticket_types_quantity_sold_non_negative;

ALTER TABLE public.ticket_types
  ADD CONSTRAINT ticket_types_quantity_sold_non_negative
  CHECK (quantity_sold >= 0);

ALTER TABLE public.ticket_types
  DROP CONSTRAINT IF EXISTS ticket_types_sales_window_alias_valid;

ALTER TABLE public.ticket_types
  ADD CONSTRAINT ticket_types_sales_window_alias_valid
  CHECK (
    sales_start_at IS NULL
    OR sales_end_at IS NULL
    OR sales_start_at <= sales_end_at
  );

UPDATE public.ticket_types
SET
  quantity_total = COALESCE(quantity_total, capacity),
  sales_start_at = COALESCE(sales_start_at, sales_starts_at),
  sales_end_at = COALESCE(sales_end_at, sales_ends_at),
  is_active = COALESCE(is_active, true);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS attendee_email text,
  ADD COLUMN IF NOT EXISTS attendee_name text,
  ADD COLUMN IF NOT EXISTS qr_code_token text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

ALTER TABLE public.tickets
  DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('active', 'checked_in', 'cancelled', 'void'));

UPDATE public.orders o
SET event_id = COALESCE(o.event_id, e.event_id)
FROM (
  SELECT DISTINCT ON (oi.order_id)
    oi.order_id,
    tt.event_id
  FROM public.order_items oi
  INNER JOIN public.ticket_types tt ON tt.id = oi.ticket_type_id
  ORDER BY oi.order_id, oi.created_at ASC, oi.id ASC
) e
WHERE o.id = e.order_id
  AND o.event_id IS NULL;

UPDATE public.orders
SET subtotal_cents = COALESCE(subtotal_cents, total_cents, 0),
    platform_fee_cents = COALESCE(platform_fee_cents, 0)
WHERE subtotal_cents IS NULL OR platform_fee_cents IS NULL;

UPDATE public.tickets t
SET attendee_email = COALESCE(t.attendee_email, u.email),
    qr_code_token = COALESCE(t.qr_code_token, t.ticket_code),
    status = CASE
      WHEN t.status IS NOT NULL AND t.status <> 'active' THEN t.status
      WHEN er.status = 'checked_in' THEN 'checked_in'
      WHEN er.status = 'cancelled' THEN 'cancelled'
      ELSE 'active'
    END,
    checked_in_at = COALESCE(t.checked_in_at, er.checked_in_at)
FROM public.event_registrations er,
     auth.users u
WHERE er.id = t.event_registration_id
  AND u.id = t.user_id;

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON public.webhook_logs(type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON public.webhook_logs(processed_at);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_logs_staff_select" ON public.webhook_logs;
CREATE POLICY "webhook_logs_staff_select" ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

CREATE OR REPLACE FUNCTION public.recalculate_ticket_type_quantity_sold(p_ticket_type_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ticket_types tt
  SET quantity_sold = COALESCE(src.active_count, 0)
  FROM (
    SELECT t.ticket_type_id, COUNT(*)::integer AS active_count
    FROM public.tickets t
    INNER JOIN public.event_registrations er ON er.id = t.event_registration_id
    WHERE t.ticket_type_id = p_ticket_type_id
      AND t.status IN ('active', 'checked_in')
      AND er.status IN ('confirmed', 'checked_in')
    GROUP BY t.ticket_type_id
  ) src
  WHERE tt.id = p_ticket_type_id;

  UPDATE public.ticket_types
  SET quantity_sold = 0
  WHERE id = p_ticket_type_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.tickets t
      INNER JOIN public.event_registrations er ON er.id = t.event_registration_id
      WHERE t.ticket_type_id = p_ticket_type_id
        AND t.status IN ('active', 'checked_in')
        AND er.status IN ('confirmed', 'checked_in')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_ticket_type_quantity_sold(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_ticket_type_quantity_sold(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_ticket_type_quantity_sold(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_recalculate_ticket_type_quantity_sold_from_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_ticket_type_quantity_sold(OLD.ticket_type_id);
    RETURN OLD;
  END IF;

  PERFORM public.recalculate_ticket_type_quantity_sold(NEW.ticket_type_id);
  IF TG_OP = 'UPDATE' AND OLD.ticket_type_id IS DISTINCT FROM NEW.ticket_type_id THEN
    PERFORM public.recalculate_ticket_type_quantity_sold(OLD.ticket_type_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_ticket_type_quantity_sold_from_tickets ON public.tickets;
CREATE TRIGGER trg_recalculate_ticket_type_quantity_sold_from_tickets
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_recalculate_ticket_type_quantity_sold_from_tickets();

CREATE OR REPLACE FUNCTION public.trg_recalculate_ticket_type_quantity_sold_from_registrations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT t.ticket_type_id
    FROM public.tickets t
    WHERE t.event_registration_id IN (OLD.id, NEW.id)
  LOOP
    PERFORM public.recalculate_ticket_type_quantity_sold(r.ticket_type_id);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_ticket_type_quantity_sold_from_registrations ON public.event_registrations;
CREATE TRIGGER trg_recalculate_ticket_type_quantity_sold_from_registrations
  AFTER UPDATE OF status ON public.event_registrations
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_recalculate_ticket_type_quantity_sold_from_registrations();

WITH distinct_ticket_types AS (
  SELECT DISTINCT ticket_type_id FROM public.tickets
)
SELECT public.recalculate_ticket_type_quantity_sold(ticket_type_id)
FROM distinct_ticket_types;

CREATE OR REPLACE FUNCTION public.mint_free_rsvp_ticket_for_registration(
  p_registration_id uuid,
  p_ticket_type_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg RECORD;
  existing_ticket uuid;
  tt_id uuid;
  t_price integer;
  t_cap integer;
  t_start timestamptz;
  t_end timestamptz;
  occ integer;
  oid uuid;
  oi_id uuid;
  new_ticket_id uuid;
  new_code text;
  attempts integer := 0;
  user_email text;
BEGIN
  SELECT er.id, er.user_id, er.event_id, er.status
  INTO reg
  FROM public.event_registrations er
  WHERE er.id = p_registration_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;

  IF reg.user_id IS DISTINCT FROM (select auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF reg.status NOT IN ('confirmed', 'checked_in') THEN
    RAISE EXCEPTION 'Registration must be confirmed or checked in';
  END IF;

  SELECT t.id INTO existing_ticket
  FROM public.tickets t
  WHERE t.event_registration_id = p_registration_id
  LIMIT 1;

  IF existing_ticket IS NOT NULL THEN
    RETURN existing_ticket;
  END IF;

  IF p_ticket_type_id IS NULL THEN
    tt_id := public.ensure_default_rsvp_ticket_type(reg.event_id);
  ELSE
    SELECT
      tt.price_cents,
      COALESCE(tt.quantity_total, tt.capacity),
      COALESCE(tt.sales_start_at, tt.sales_starts_at),
      COALESCE(tt.sales_end_at, tt.sales_ends_at)
    INTO t_price, t_cap, t_start, t_end
    FROM public.ticket_types tt
    WHERE tt.id = p_ticket_type_id
      AND tt.event_id = reg.event_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ticket type not found for this event';
    END IF;

    IF t_price IS DISTINCT FROM 0 THEN
      RAISE EXCEPTION 'RSVP only supports free ticket types';
    END IF;

    IF t_start IS NOT NULL AND now() < t_start THEN
      RAISE EXCEPTION 'Ticket type is not on sale yet';
    END IF;

    IF t_end IS NOT NULL AND now() > t_end THEN
      RAISE EXCEPTION 'Ticket type sales have ended';
    END IF;

    IF t_cap IS NOT NULL THEN
      SELECT COUNT(*)::int INTO occ
      FROM public.tickets t2
      INNER JOIN public.event_registrations er2 ON er2.id = t2.event_registration_id
      WHERE t2.ticket_type_id = p_ticket_type_id
        AND t2.status IN ('active', 'checked_in')
        AND er2.status IN ('confirmed', 'checked_in');

      IF occ >= t_cap THEN
        RAISE EXCEPTION 'This ticket type is full'
          USING ERRCODE = '23514';
      END IF;
    END IF;

    tt_id := p_ticket_type_id;
  END IF;

  SELECT u.email INTO user_email
  FROM auth.users u
  WHERE u.id = reg.user_id;

  INSERT INTO public.orders (user_id, event_id, status, subtotal_cents, platform_fee_cents, total_cents, currency)
  VALUES (reg.user_id, reg.event_id, 'completed', 0, 0, 0, 'usd')
  RETURNING id INTO oid;

  INSERT INTO public.order_items (order_id, ticket_type_id, quantity, unit_price_cents, line_total_cents)
  VALUES (oid, tt_id, 1, 0, 0)
  RETURNING id INTO oi_id;

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
        ticket_code,
        attendee_email,
        qr_code_token,
        status,
        checked_in_at
      )
      VALUES (
        oid,
        oi_id,
        tt_id,
        reg.event_id,
        reg.user_id,
        p_registration_id,
        new_code,
        user_email,
        new_code,
        CASE WHEN reg.status = 'checked_in' THEN 'checked_in' ELSE 'active' END,
        CASE WHEN reg.status = 'checked_in' THEN now() ELSE NULL END
      )
      RETURNING id INTO new_ticket_id;
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        NULL;
    END;
  END LOOP;

  RETURN new_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid, uuid) TO service_role;

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

  SELECT *
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT *
  INTO v_order_item
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
  ORDER BY oi.created_at ASC, oi.id ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item not found';
  END IF;

  IF v_order.status = 'completed' THEN
    SELECT t.id INTO v_ticket_id
    FROM public.tickets t
    WHERE t.order_id = p_order_id
    LIMIT 1;

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

  IF p_amount_total_cents IS NOT NULL AND p_amount_total_cents <> v_order.total_cents THEN
    RAISE EXCEPTION 'Payment amount does not match order total';
  END IF;

  IF lower(coalesce(v_order.currency, 'usd')) IS DISTINCT FROM lower(coalesce(p_currency, 'usd')) THEN
    RAISE EXCEPTION 'Currency mismatch';
  END IF;

  SELECT
    tt.event_id,
    tt.price_cents,
    tt.currency,
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

  IF tt_price IS DISTINCT FROM v_order.subtotal_cents THEN
    RAISE EXCEPTION 'Order subtotal does not match ticket price';
  END IF;

  IF lower(coalesce(tt_currency, 'usd')) IS DISTINCT FROM lower(coalesce(v_order.currency, 'usd')) THEN
    RAISE EXCEPTION 'Ticket currency mismatch';
  END IF;

  SELECT e.status, e.rsvp_capacity
  INTO ev_status, ev_cap
  FROM public.events e
  WHERE e.id = v_order.event_id;

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
      RAISE EXCEPTION 'This ticket type is full'
        USING ERRCODE = '23514';
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
    v_order.event_id,
    v_order.user_id,
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

  SELECT u.email INTO user_email
  FROM auth.users u
  WHERE u.id = v_order.user_id;

  UPDATE public.orders
  SET status = 'completed',
      stripe_checkout_session_id = p_stripe_checkout_session_id,
      stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
      updated_at = now()
  WHERE id = p_order_id;

  SELECT t.id INTO v_ticket_id
  FROM public.tickets t
  WHERE t.order_id = p_order_id
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
        ticket_code,
        attendee_email,
        qr_code_token,
        status,
        checked_in_at
      )
      VALUES (
        p_order_id,
        v_order_item.id,
        v_order_item.ticket_type_id,
        v_order.event_id,
        v_order.user_id,
        reg_id,
        new_code,
        user_email,
        new_code,
        'active',
        NULL
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
