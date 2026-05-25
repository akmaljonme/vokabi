-- Advertisements table
CREATE TABLE public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  link_text text DEFAULT 'Batafsil',
  type text NOT NULL CHECK (type IN ('banner', 'popup', 'sidebar')),
  position text DEFAULT 'top' CHECK (position IN ('top', 'bottom', 'left', 'right')),
  is_active boolean NOT NULL DEFAULT true,
  show_to text NOT NULL DEFAULT 'free' CHECK (show_to IN ('free', 'all')),
  priority integer NOT NULL DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Faqat adminlar boshqaradi
CREATE POLICY "Admins can manage ads" ON public.advertisements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Barcha foydalanuvchilar ko'ra oladi (faol reklamalar)
CREATE POLICY "Users can view active ads" ON public.advertisements
  FOR SELECT TO authenticated
  USING (is_active = true AND (end_date IS NULL OR end_date > now()));

-- Click va view count yangilash funksiyasi
CREATE OR REPLACE FUNCTION public.increment_ad_stat(ad_id uuid, stat_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF stat_type = 'view' THEN
    UPDATE advertisements SET view_count = view_count + 1 WHERE id = ad_id;
  ELSIF stat_type = 'click' THEN
    UPDATE advertisements SET click_count = click_count + 1 WHERE id = ad_id;
  END IF;
END;
$$;

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view ad images" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-images');

CREATE POLICY "Admins can upload ad images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'::app_role));
