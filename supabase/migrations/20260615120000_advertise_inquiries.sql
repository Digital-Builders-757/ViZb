-- Partnership / advertising inquiries from the public /advertise form.
-- Inserts are server-only via service role (Next.js server action); no public RLS policies.

CREATE TABLE public.advertise_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  interest_type text NOT NULL,
  budget_range text,
  message text NOT NULL,
  submission_context text,
  status text NOT NULL DEFAULT 'new',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT advertise_inquiries_status_check CHECK (
    status IN ('new', 'contacted', 'qualified', 'closed', 'spam')
  )
);

COMMENT ON TABLE public.advertise_inquiries IS
  'Public partnership/advertising form submissions from /advertise. Read/update via Supabase Studio or future staff admin; not exposed to anon/authenticated clients.';

COMMENT ON COLUMN public.advertise_inquiries.submission_context IS
  'Optional attribution line from in-app CTAs (e.g. organizer dashboard referrer).';

COMMENT ON COLUMN public.advertise_inquiries.status IS
  'Workflow status: new, contacted, qualified, closed, spam.';

COMMENT ON COLUMN public.advertise_inquiries.metadata IS
  'Server-side metadata (e.g. source: advertise_form).';

CREATE INDEX advertise_inquiries_created_at_idx
  ON public.advertise_inquiries (created_at DESC);

ALTER TABLE public.advertise_inquiries ENABLE ROW LEVEL SECURITY;
