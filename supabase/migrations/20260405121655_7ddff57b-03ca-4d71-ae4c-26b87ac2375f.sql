
-- Add access_code column to exams
ALTER TABLE public.exams ADD COLUMN access_code text DEFAULT NULL;

-- Drop old assignment-based SELECT policies
DROP POLICY IF EXISTS "Assigned users can view active exams" ON public.exams;
DROP POLICY IF EXISTS "Permitted users can view active exams" ON public.exams;

-- Allow all authenticated users to view active exams
CREATE POLICY "Anyone can view active exams"
ON public.exams
FOR SELECT
TO authenticated
USING (is_active = true);
