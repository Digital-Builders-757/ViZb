-- Post cover images for admin-authored community posts (public read; staff_admin write).
-- App stores the public URL in posts.cover_image_url — same pattern as event-flyers.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-covers',
  'post-covers',
  true,
  3145728, -- 3MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "post_covers_select_public" ON storage.objects;
CREATE POLICY "post_covers_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'post-covers');

DROP POLICY IF EXISTS "post_covers_insert_staff" ON storage.objects;
CREATE POLICY "post_covers_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-covers'
    AND public.is_staff_admin()
  );

DROP POLICY IF EXISTS "post_covers_update_staff" ON storage.objects;
CREATE POLICY "post_covers_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-covers'
    AND public.is_staff_admin()
  );

DROP POLICY IF EXISTS "post_covers_delete_staff" ON storage.objects;
CREATE POLICY "post_covers_delete_staff" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-covers'
    AND public.is_staff_admin()
  );
