-- Ensure Storage buckets exist on hosted projects where older migrations were skipped or buckets were never created.
-- Covers: post cover images (admin), event flyers (org members), optional general post assets bucket (staff).

-- ---------------------------------------------------------------------------
-- Buckets (idempotent upsert so limits/MIME lists stay aligned with app code)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-covers',
  'post-covers',
  true,
  3145728, -- 3MB — lib/posts/cover-upload-constraints.ts
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-flyers',
  'event-flyers',
  true,
  5242880, -- 5MB — lib/events/flyer-upload-constraints.ts
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- General post media (inline images, attachments); staff-only write. App may adopt paths later.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- post-covers — public read; staff_admin writes (see app/actions/admin-posts.ts)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- event-flyers — public read; org members (path prefix = org_id) or staff
-- Path format: {org_id}/{event_id}/{filename} (app/actions/event.ts)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "event_flyers_select_public" ON storage.objects;
CREATE POLICY "event_flyers_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'event-flyers');

DROP POLICY IF EXISTS "event_flyers_insert_org_or_staff" ON storage.objects;
CREATE POLICY "event_flyers_insert_org_or_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-flyers'
    AND (
      public.is_staff_admin()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id::text = split_part(name, '/', 1)
      )
    )
  );

DROP POLICY IF EXISTS "event_flyers_update_org_or_staff" ON storage.objects;
CREATE POLICY "event_flyers_update_org_or_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-flyers'
    AND (
      public.is_staff_admin()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id::text = split_part(name, '/', 1)
      )
    )
  )
  WITH CHECK (
    bucket_id = 'event-flyers'
    AND (
      public.is_staff_admin()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id::text = split_part(name, '/', 1)
      )
    )
  );

DROP POLICY IF EXISTS "event_flyers_delete_org_or_staff" ON storage.objects;
CREATE POLICY "event_flyers_delete_org_or_staff" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-flyers'
    AND (
      public.is_staff_admin()
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id::text = split_part(name, '/', 1)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- posts — public read; staff_admin writes (reserved for future post attachments)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "posts_bucket_select_public" ON storage.objects;
CREATE POLICY "posts_bucket_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "posts_bucket_insert_staff" ON storage.objects;
CREATE POLICY "posts_bucket_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'posts'
    AND public.is_staff_admin()
  );

DROP POLICY IF EXISTS "posts_bucket_update_staff" ON storage.objects;
CREATE POLICY "posts_bucket_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'posts'
    AND public.is_staff_admin()
  );

DROP POLICY IF EXISTS "posts_bucket_delete_staff" ON storage.objects;
CREATE POLICY "posts_bucket_delete_staff" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'posts'
    AND public.is_staff_admin()
  );
