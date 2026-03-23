-- ViBE Phase 1: Organizations + Organization Members
-- Spec Reference: VIBE_APP_SPECIFICATION.md Sections 5.2, 6.2, 6.3

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type org_type NOT NULL DEFAULT 'promoter',
  status org_status NOT NULL DEFAULT 'pending',
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization Members (join table)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_member_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations RLS Policies

-- Published (active) orgs are visible to everyone
CREATE POLICY "orgs_select_active"
  ON public.organizations FOR SELECT
  USING (status = 'active');

-- Org members can see their own orgs regardless of status
CREATE POLICY "orgs_select_own_member"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE org_id = organizations.id
      AND user_id = auth.uid()
    )
  );

-- Any authenticated user can create an org
CREATE POLICY "orgs_insert_authenticated"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only org owners can update their org
CREATE POLICY "orgs_update_owner"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE org_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Organization Members RLS Policies

-- Members can see other members in their org
CREATE POLICY "org_members_select_same_org"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
    )
  );

-- Authenticated users can insert themselves (for creating orgs)
CREATE POLICY "org_members_insert_self"
  ON public.organization_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only org owners can update member roles
CREATE POLICY "org_members_update_owner"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Only org owners can remove members
CREATE POLICY "org_members_delete_owner"
  ON public.organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Updated_at trigger for organizations
DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
