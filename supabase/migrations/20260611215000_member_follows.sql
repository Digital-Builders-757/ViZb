-- Follow organizer + category primitives (#161).

CREATE TABLE IF NOT EXISTS public.organization_follows (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_follows_org_id ON public.organization_follows (org_id);

CREATE TABLE IF NOT EXISTS public.member_category_follows (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);

ALTER TABLE public.organization_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_category_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organization_follows_select_own" ON public.organization_follows
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "organization_follows_insert_own" ON public.organization_follows
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "organization_follows_delete_own" ON public.organization_follows
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "member_category_follows_select_own" ON public.member_category_follows
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "member_category_follows_insert_own" ON public.member_category_follows
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "member_category_follows_delete_own" ON public.member_category_follows
  FOR DELETE TO authenticated USING (user_id = auth.uid());

COMMENT ON TABLE public.organization_follows IS 'Member follows for organizer discovery and recommendations.';
COMMENT ON TABLE public.member_category_follows IS 'Member category follows for discovery rails.';
