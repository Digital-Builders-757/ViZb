-- M1: VIZB centralized pricing — store buyer processing fee passthrough on orders.
-- total_cents = subtotal_cents + platform_fee_cents + processing_fee_cents

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS processing_fee_cents integer NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_amounts_non_negative;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_amounts_non_negative
  CHECK (
    subtotal_cents >= 0
    AND platform_fee_cents >= 0
    AND processing_fee_cents >= 0
    AND total_cents >= 0
    AND total_cents = subtotal_cents + platform_fee_cents + processing_fee_cents
  );

UPDATE public.orders
SET processing_fee_cents = 0
WHERE processing_fee_cents IS NULL;
