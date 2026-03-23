-- Migration 014: Create Supabase Storage bucket for event flyers
-- Allows org members to upload flyer images for their events

-- Create the storage bucket (public read, authenticated upload)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-flyers',
  'event-flyers',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket)
DROP POLICY IF EXISTS "event_flyers_select_public" ON storage.objects;
CREATE POLICY "event_flyers_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'event-flyers');

-- Authenticated users who are org members can upload flyers
-- Path format: event-flyers/{org_id}/{event_id}/{filename}
DROP POLICY IF EXISTS "event_flyers_insert_org_member" ON storage.objects;
CREATE POLICY "event_flyers_insert_org_member" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-flyers'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = (storage.foldername(name))[1]::uuid
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- Org admins/owners can delete flyers
DROP POLICY IF EXISTS "event_flyers_delete_org_admin" ON storage.objects;
CREATE POLICY "event_flyers_delete_org_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-flyers'
    AND (
      EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = (storage.foldername(name))[1]::uuid
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.platform_role = 'staff_admin'
      )
    )
  );

-- Org members can update/overwrite flyers
DROP POLICY IF EXISTS "event_flyers_update_org_member" ON storage.objects;
CREATE POLICY "event_flyers_update_org_member" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-flyers'
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = (storage.foldername(name))[1]::uuid
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    )
  );
