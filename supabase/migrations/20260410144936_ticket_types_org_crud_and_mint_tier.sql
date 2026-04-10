-- Organizer CRUD for ticket_types + optional per-tier capacity / sale window.
-- Extends mint_free_rsvp_ticket_for_registration to accept optional free tier id (second arg).

ALTER TABLE public.ticket_types
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS sales_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS sales_ends_at timestamptz;

COMMENT ON COLUMN public.ticket_types.capacity IS
  'Max issued tickets (confirmed/checked_in registrations) for this tier; NULL = unlimited.';

ALTER TABLE public.ticket_types
  DROP CONSTRAINT IF EXISTS ticket_types_capacity_positive;

ALTER TABLE public.ticket_types
  ADD CONSTRAINT ticket_types_capacity_positive
  CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE public.ticket_types
  DROP CONSTRAINT IF EXISTS ticket_types_sale_window_valid;

ALTER TABLE public.ticket_types
  ADD CONSTRAINT ticket_types_sale_window_valid
  CHECK (
    sales_starts_at IS NULL
    OR sales_ends_at IS NULL
    OR sales_starts_at <= sales_ends_at
  );

-- Anonymous visitors on the public event page can read tiers for published events.
CREATE POLICY "ticket_types_select_anon_published_event" ON public.ticket_types
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = ticket_types.event_id
        AND e.status = 'published'
    )
  );

-- Org editors manage ticket types for their org events; staff can manage any.
CREATE POLICY "ticket_types_insert_org_editor" ON public.ticket_types
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = ticket_types.event_id
        AND om.user_id = (select auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "ticket_types_update_org_editor" ON public.ticket_types
  FOR UPDATE TO authenticated
  USING (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = ticket_types.event_id
        AND om.user_id = (select auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = ticket_types.event_id
        AND om.user_id = (select auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "ticket_types_delete_org_editor" ON public.ticket_types
  FOR DELETE TO authenticated
  USING (
    public.is_staff_admin()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = ticket_types.event_id
        AND om.user_id = (select auth.uid())
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- Replace mint RPC (single signature with default second arg; drop old 1-arg overload from PostgREST).
DROP FUNCTION IF EXISTS public.mint_free_rsvp_ticket_for_registration(uuid);

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
    SELECT tt.price_cents, tt.capacity, tt.sales_starts_at, tt.sales_ends_at
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
        AND er2.status IN ('confirmed', 'checked_in');

      IF occ >= t_cap THEN
        RAISE EXCEPTION 'This ticket type is full'
          USING ERRCODE = '23514';
      END IF;
    END IF;

    tt_id := p_ticket_type_id;
  END IF;

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

REVOKE ALL ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mint_free_rsvp_ticket_for_registration(uuid, uuid) TO service_role;
