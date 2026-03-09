
CREATE TABLE public.video_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  youtube_id text,
  skill text NOT NULL DEFAULT 'grammar',
  level text NOT NULL DEFAULT 'A1',
  thumbnail_url text,
  duration text,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active video lessons" ON public.video_lessons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage video lessons" ON public.video_lessons
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
