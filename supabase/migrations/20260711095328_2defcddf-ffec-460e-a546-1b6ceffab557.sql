
-- Editable site content (per-section JSONB)
CREATE TABLE public.site_content (
  section text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content public read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "site_content admin write" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "site_content admin update" ON public.site_content FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "site_content admin delete" ON public.site_content FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Named media slots (hero, journey, bedroom, etc.)
CREATE TABLE public.site_media (
  slot text PRIMARY KEY,
  url text NOT NULL,
  alt text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_media TO anon, authenticated;
GRANT ALL ON public.site_media TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_media TO authenticated;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_media public read" ON public.site_media FOR SELECT USING (true);
CREATE POLICY "site_media admin write" ON public.site_media FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "site_media admin update" ON public.site_media FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "site_media admin delete" ON public.site_media FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER site_media_updated_at BEFORE UPDATE ON public.site_media FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Gallery images (ordered list)
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT ON public.gallery_images TO anon, authenticated;
GRANT ALL ON public.gallery_images TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery public read" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "gallery admin insert" ON public.gallery_images FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "gallery admin update" ON public.gallery_images FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "gallery admin delete" ON public.gallery_images FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX gallery_images_sort_idx ON public.gallery_images (sort_order, created_at);

-- Storage policies for site-media bucket (bucket created via tool)
CREATE POLICY "site-media public read" ON storage.objects FOR SELECT USING (bucket_id = 'site-media');
CREATE POLICY "site-media admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_admin());
CREATE POLICY "site-media admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND public.is_admin());
CREATE POLICY "site-media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.is_admin());
