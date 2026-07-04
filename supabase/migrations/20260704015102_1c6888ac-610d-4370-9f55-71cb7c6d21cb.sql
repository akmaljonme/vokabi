-- Enums
DO $$ BEGIN
  CREATE TYPE public.mock_skill AS ENUM ('listening','reading','writing','speaking');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mock_question_type AS ENUM (
    'multiple_choice','multiple_choice_multi','true_false_notgiven','yes_no_notgiven',
    'matching_headings','matching_features','matching_information',
    'sentence_completion','note_completion','short_answer',
    'writing_task','speaking_question'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Parts
CREATE TABLE IF NOT EXISTS public.mock_test_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id uuid NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  skill public.mock_skill NOT NULL,
  part_number integer NOT NULL DEFAULT 1,
  title text,
  instruction text,
  passage_text text,
  audio_url text,
  image_url text,
  duration_seconds integer,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_test_parts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_test_parts TO authenticated;
GRANT ALL ON public.mock_test_parts TO service_role;
ALTER TABLE public.mock_test_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_parts_public_read" ON public.mock_test_parts FOR SELECT USING (true);
CREATE POLICY "mock_parts_admin_all" ON public.mock_test_parts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_mock_parts_test ON public.mock_test_parts(mock_test_id, skill, part_number);

-- Questions
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES public.mock_test_parts(id) ON DELETE CASCADE,
  question_number integer NOT NULL DEFAULT 1,
  question_type public.mock_question_type NOT NULL,
  question_text text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer jsonb NOT NULL DEFAULT '[]'::jsonb,
  group_label text,
  points numeric NOT NULL DEFAULT 1,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_test_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_test_questions TO authenticated;
GRANT ALL ON public.mock_test_questions TO service_role;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_qs_public_read" ON public.mock_test_questions FOR SELECT USING (true);
CREATE POLICY "mock_qs_admin_all" ON public.mock_test_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_mock_qs_part ON public.mock_test_questions(part_id, question_number);

-- Attempts
CREATE TABLE IF NOT EXISTS public.mock_test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mock_test_id uuid NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  skill public.mock_skill NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score numeric,
  total numeric,
  band_score numeric,
  ai_feedback jsonb,
  time_taken_seconds integer,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_test_attempts TO authenticated;
GRANT ALL ON public.mock_test_attempts TO service_role;
ALTER TABLE public.mock_test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_attempts_own_all" ON public.mock_test_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mock_attempts_admin_read" ON public.mock_test_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_mock_attempts_user ON public.mock_test_attempts(user_id, mock_test_id, skill);

-- Updated_at triggers
CREATE TRIGGER trg_mock_parts_updated BEFORE UPDATE ON public.mock_test_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mock_qs_updated BEFORE UPDATE ON public.mock_test_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mock_attempts_updated BEFORE UPDATE ON public.mock_test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
