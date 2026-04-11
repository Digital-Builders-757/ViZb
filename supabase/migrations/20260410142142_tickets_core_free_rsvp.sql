-- Core ticketing model: ticket_types, orders, order_items, tickets.
-- Free RSVP still upserts event_registrations; mint_free_rsvp_ticket_for_registration
-- creates a $0 completed order + one ticket (16-char hex ticket_code) 1:1 with the registration.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default_rsvp BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ticket_types_price_non_negative CHECK (price_cents >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ticket_types_one_default_rsvp_per_event
  ON public.ticket_types (event_id)
  WHERE is_default_rsvp = true;

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON public.ticket_types(event_id);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending_payment', 'completed', 'cancelled', 'refunded')),
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_registration_id UUID NOT NULL UNIQUE
    REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tickets_ticket_code_hex_len CHECK (ticket_code ~ '^[0-9a-f]{16}$')
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);

COMMENT ON TABLE public.ticket_types IS 'Sellable tiers per event; is_default_rsvp links free RSVP to a $0 type.';
COMMENT ON TABLE public.orders IS 'Purchases; free RSVP uses completed orders with total_cents = 0.';
COMMENT ON TABLE public.tickets IS 'Issued passes; one row per event_registration for free RSVP (v1).';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_types_select_authenticated" ON public.ticket_types
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "order_items_select_via_order" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = (select auth.uid())
    )
  );

CREATE POLICY "tickets_select_own" ON public.tickets
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "tickets_select_org" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = tickets.event_id
        AND public.is_org_member(e.org_id)
    )
  );

CREATE POLICY "tickets_select_staff" ON public.tickets
  FOR SELECT TO authenticated
  USING (public.is_staff_admin());

-- -----------------------------------------------------------------------------
-- RPC: default $0 RSVP tier (internal; no EXECUTE for authenticated)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ensure_default_rsvp_ticket_type(p_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid
  FROM public.ticket_types
  WHERE event_id = p_event_id
    AND is_default_rsvp = true
  LIMIT 1;

  IF tid IS NOT NULL THEN
    RETURN tid;
  END IF;

  INSERT INTO public.ticket_types (event_id, name, price_cents, is_default_rsvp)
  VALUES (p_event_id, 'RSVP', 0, true)
  RETURNING id INTO tid;

  RETURN tid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_default_rsvp_ticket_type(uuid) FROM PUBLIC;

-- -----------------------------------------------------------------------------
-- RPC: mint 1:1 ticket for a confirmed registration (idempotent)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mint_free_rsvp_ticket_for_registration(p_registration_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reg RECORD;
  existing_ticket uuid;
  tt_id uuid;
  oid uuid;
  oi_id uuid;
  new_ticket_id uuid;
  new_code text;
  attempts integer := 0;
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

  tt_id := public.ensure_default_rsvp_ticket_type(reg.event_id);

  INSERT INTO public.orders (user_id, status, total_cents, currency)
  VALUES (reg.user_id, 'completed', 0, 'usd')
  RETURNING id INTO oid;

  INSERT INTO public.order_items (order_id, ticket_type_id, quantity, unit_price_cents, line_total_cents)
  VALUES (oid, tt_id, 1, 0, 0)
  RETURNING id INTO oi_id;

  LOOP
    attempts := attempts + 1;
    IF attempts > 25 THEN
      RAISE EXCEPTION 'Could not allocate ticket_code';
    END IF;

    new_code := encode(gen_random_bytes(8), 'hex');

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
      VALUES (oid, oi_id, tt_id, reg.event_id, reg.user_id, p_registration_id, new_code)
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

REVOKE ALL ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid) TO service_role;

-- -----------------------------------------------------------------------------
-- Backfill: existing confirmed / checked-in RSVPs -> tickets
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
  tt_id uuid;
  oid uuid;
  oi_id uuid;
  new_ticket_id uuid;
  new_code text;
  attempts integer;
BEGIN
  FOR r IN
    SELECT er.id AS reg_id, er.event_id, er.user_id
    FROM public.event_registrations er
    WHERE er.status IN ('confirmed', 'checked_in')
      AND NOT EXISTS (
        SELECT 1
        FROM public.tickets t
        WHERE t.event_registration_id = er.id
      )
  LOOP
    SELECT id INTO tt_id
    FROM public.ticket_types
    WHERE event_id = r.event_id
      AND is_default_rsvp = true
    LIMIT 1;

    IF tt_id IS NULL THEN
      INSERT INTO public.ticket_types (event_id, name, price_cents, is_default_rsvp)
      VALUES (r.event_id, 'RSVP', 0, true)
      RETURNING id INTO tt_id;
    END IF;

    INSERT INTO public.orders (user_id, status, total_cents, currency)
    VALUES (r.user_id, 'completed', 0, 'usd')
    RETURNING id INTO oid;

    INSERT INTO public.order_items (order_id, ticket_type_id, quantity, unit_price_cents, line_total_cents)
    VALUES (oid, tt_id, 1, 0, 0)
    RETURNING id INTO oi_id;

    attempts := 0;
    LOOP
      attempts := attempts + 1;
      IF attempts > 25 THEN
        RAISE EXCEPTION 'Backfill: could not allocate ticket_code for registration %', r.reg_id;
      END IF;

      new_code := encode(gen_random_bytes(8), 'hex');

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
        VALUES (oid, oi_id, tt_id, r.event_id, r.user_id, r.reg_id, new_code)
        RETURNING id INTO new_ticket_id;
        EXIT;
      EXCEPTION
        WHEN unique_violation THEN
          NULL;
      END;
    END LOOP;
  END LOOP;
END $$;
