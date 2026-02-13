
-- Exam groups table
CREATE TABLE public.exam_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_groups ENABLE ROW LEVEL SECURITY;

-- Group members table
CREATE TABLE public.exam_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.exam_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.exam_group_members ENABLE ROW LEVEL SECURITY;

-- Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  skill TEXT NOT NULL,
  level TEXT NOT NULL,
  time_limit INTEGER NOT NULL DEFAULT 1800,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Exam group permissions
CREATE TABLE public.exam_group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.exam_groups(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, exam_id)
);

ALTER TABLE public.exam_group_permissions ENABLE ROW LEVEL SECURITY;

-- Exam questions
CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Exam attempts
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  percentage INTEGER,
  passed BOOLEAN,
  answers JSONB,
  time_taken INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- Exam reading passages
CREATE TABLE public.exam_reading_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  paragraphs JSONB,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_reading_passages ENABLE ROW LEVEL SECURITY;

-- Exam audio files
CREATE TABLE public.exam_audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  transcript TEXT,
  duration INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_audio_files ENABLE ROW LEVEL SECURITY;

-- Now create all RLS policies

-- exam_groups policies
CREATE POLICY "Admins can manage exam groups" ON public.exam_groups
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can view their groups" ON public.exam_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_group_members
      WHERE exam_group_members.group_id = exam_groups.id
        AND exam_group_members.user_id = auth.uid()
    )
  );

-- exam_group_members policies
CREATE POLICY "Admins can manage group members" ON public.exam_group_members
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own memberships" ON public.exam_group_members
  FOR SELECT USING (auth.uid() = user_id);

-- exams policies
CREATE POLICY "Admins can manage exams" ON public.exams
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Permitted users can view active exams" ON public.exams
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.exam_group_permissions egp
      JOIN public.exam_group_members egm ON egm.group_id = egp.group_id
      WHERE egp.exam_id = exams.id AND egm.user_id = auth.uid()
    )
  );

-- exam_group_permissions policies
CREATE POLICY "Admins can manage exam permissions" ON public.exam_group_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own permissions" ON public.exam_group_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_group_members
      WHERE exam_group_members.group_id = exam_group_permissions.group_id
        AND exam_group_members.user_id = auth.uid()
    )
  );

-- exam_questions policies
CREATE POLICY "Admins can manage exam questions" ON public.exam_questions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Permitted users can view exam questions" ON public.exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.exam_group_permissions egp ON egp.exam_id = e.id
      JOIN public.exam_group_members egm ON egm.group_id = egp.group_id
      WHERE e.id = exam_questions.exam_id AND e.is_active = true AND egm.user_id = auth.uid()
    )
  );

-- exam_attempts policies
CREATE POLICY "Admins can view all attempts" ON public.exam_attempts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own attempts" ON public.exam_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON public.exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" ON public.exam_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- exam_reading_passages policies
CREATE POLICY "Admins can manage exam passages" ON public.exam_reading_passages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Permitted users can view exam passages" ON public.exam_reading_passages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.exam_group_permissions egp ON egp.exam_id = e.id
      JOIN public.exam_group_members egm ON egm.group_id = egp.group_id
      WHERE e.id = exam_reading_passages.exam_id AND e.is_active = true AND egm.user_id = auth.uid()
    )
  );

-- exam_audio_files policies
CREATE POLICY "Admins can manage exam audio" ON public.exam_audio_files
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Permitted users can view exam audio" ON public.exam_audio_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.exam_group_permissions egp ON egp.exam_id = e.id
      JOIN public.exam_group_members egm ON egm.group_id = egp.group_id
      WHERE e.id = exam_audio_files.exam_id AND e.is_active = true AND egm.user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_exam_groups_updated_at BEFORE UPDATE ON public.exam_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON public.exam_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
