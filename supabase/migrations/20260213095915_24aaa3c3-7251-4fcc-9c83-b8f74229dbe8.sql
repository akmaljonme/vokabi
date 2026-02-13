
-- Create direct user-to-exam assignment table
CREATE TABLE public.exam_user_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(exam_id, user_id)
);

ALTER TABLE public.exam_user_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignments"
ON public.exam_user_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own assignments"
ON public.exam_user_assignments FOR SELECT
USING (auth.uid() = user_id);

-- Update exams RLS: add policy for directly assigned users
CREATE POLICY "Assigned users can view active exams"
ON public.exams FOR SELECT
USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.exam_user_assignments
    WHERE exam_user_assignments.exam_id = exams.id
    AND exam_user_assignments.user_id = auth.uid()
  )
);
