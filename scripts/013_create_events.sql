-- Migration 013: Create events + event_media tables
-- Phase 2 core -- events are the heart of ViBE

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Core fields
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Date/time
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  
  -- Location (text-based for MVP, no map integration)
  venue_name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('party', 'workshop', 'networking', 'social', 'concert', 'other')),
  
  -- Status workflow: draft -> pending_review -> published / rejected / cancelled
  status public.event_status NOT NULL DEFAULT 'draft',
  
  -- Flyer (required for publish, stored as URL from Supabase Storage)
  flyer_url TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  
  -- Unique slug per org
  CONSTRAINT events_org_slug_unique UNIQUE (org_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- ============================================
-- EVENT_MEDIA TABLE (gallery images, additional flyers)
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  kind public.media_kind NOT NULL DEFAULT 'gallery',
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_media_event_id ON public.event_media(event_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;

-- EVENTS: Public can read published events
CREATE POLICY "events_select_published" ON public.events
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- EVENTS: Org members can read all their org's events (including drafts)
CREATE POLICY "events_select_org_member" ON public.events
  FOR SELECT TO authenticated
  USING (is_org_member(org_id));

-- EVENTS: Staff admin can read all events
CREATE POLICY "events_select_staff" ON public.events
  FOR SELECT TO authenticated
  USING (is_staff_admin());

-- EVENTS: Org members (owner/admin/editor) can create events
CREATE POLICY "events_insert_org_member" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    is_org_member(org_id)
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- EVENTS: Org owner/admin can update events (including publish)
CREATE POLICY "events_update_org_admin" ON public.events
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR is_staff_admin()
  );

-- EVENTS: Editors can update their own drafts
CREATE POLICY "events_update_editor_own_draft" ON public.events
  FOR UPDATE TO authenticated
  USING (
    status = 'draft'
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = events.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'editor'
    )
  );

-- EVENTS: Only org owner or staff can delete events
CREATE POLICY "events_delete_owner" ON public.events
  FOR DELETE TO authenticated
  USING (
    is_org_owner(org_id) OR is_staff_admin()
  );

-- EVENT_MEDIA: Same read access as events
CREATE POLICY "event_media_select_published" ON public.event_media
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_media.event_id AND e.status = 'published')
  );

CREATE POLICY "event_media_select_org_member" ON public.event_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_media.event_id AND is_org_member(e.org_id))
  );

-- EVENT_MEDIA: Org members can manage media for their events
CREATE POLICY "event_media_insert_org_member" ON public.event_media
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_members om ON om.org_id = e.org_id
      WHERE e.id = event_media.event_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "event_media_delete_org_admin" ON public.event_media
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_media.event_id
        AND (is_org_owner(e.org_id) OR is_staff_admin())
    )
  );
