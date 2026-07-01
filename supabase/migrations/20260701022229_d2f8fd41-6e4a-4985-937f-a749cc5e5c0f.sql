
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT NOT NULL DEFAULT 'Batafsil',
  type TEXT NOT NULL DEFAULT 'banner' CHECK (type IN ('banner','popup','sidebar')),
  position TEXT NOT NULL DEFAULT 'top',
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_to TEXT NOT NULL DEFAULT 'free',
  priority INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advertisements TO authenticated;
GRANT ALL ON public.advertisements TO service_role;

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ads"
  ON public.advertisements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert ads"
  ON public.advertisements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ads"
  ON public.advertisements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ads"
  ON public.advertisements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS update_advertisements_updated_at ON public.advertisements;
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_ad_stat(ad_id UUID, stat_type TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF stat_type = 'view' THEN
    UPDATE public.advertisements SET view_count = view_count + 1 WHERE id = ad_id;
  ELSIF stat_type = 'click' THEN
    UPDATE public.advertisements SET click_count = click_count + 1 WHERE id = ad_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_stat(UUID, TEXT) TO authenticated;
