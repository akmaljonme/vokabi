
CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  message text NOT NULL,
  level_info text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved feedbacks (for landing page)
CREATE POLICY "Anyone can view approved feedbacks"
ON public.feedbacks FOR SELECT
USING (is_approved = true);

-- Admins can view all feedbacks
CREATE POLICY "Admins can view all feedbacks"
ON public.feedbacks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON public.feedbacks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can update feedbacks (approve/reject)
CREATE POLICY "Admins can update feedbacks"
ON public.feedbacks FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete feedbacks
CREATE POLICY "Admins can delete feedbacks"
ON public.feedbacks FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
