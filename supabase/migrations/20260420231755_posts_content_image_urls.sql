-- Ordered gallery images for post body (admin uploads to storage `posts` bucket; public URLs stored here).
-- Max 6 images per post; empty array means no inline gallery.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content_image_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_content_image_urls_max_6;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_content_image_urls_max_6
  CHECK (cardinality(content_image_urls) <= 6);

COMMENT ON COLUMN public.posts.content_image_urls IS
  'Up to 6 public Supabase Storage URLs for images shown below post body (bucket: posts).';
