-- Create tests table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  skill TEXT NOT NULL CHECK (skill IN ('reading', 'listening', 'grammar', 'vocabulary')),
  time_limit INTEGER NOT NULL DEFAULT 1800, -- 30 minutes in seconds
  is_active BOOLEAN NOT NULL DEFAULT true,
  randomize_questions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple-choice', 'true-false', 'fill-blank', 'matching-headings', 'matching-paragraph', 'matching-features', 'matching-endings', 'list-selection', 'choose-title')),
  category TEXT NOT NULL CHECK (category IN ('grammar', 'vocabulary', 'reading', 'listening')),
  options JSONB, -- Array of options for multiple choice
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading passages table
CREATE TABLE public.reading_passages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  paragraphs JSONB, -- Array of {label, text} for paragraph matching
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audio files table for listening tests
CREATE TABLE public.audio_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  duration INTEGER, -- Duration in seconds
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests table
CREATE POLICY "Anyone can view active tests"
  ON public.tests FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all tests"
  ON public.tests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create tests"
  ON public.tests FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tests"
  ON public.tests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tests"
  ON public.tests FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for questions table
CREATE POLICY "Users can view questions for active tests"
  ON public.questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tests 
    WHERE tests.id = questions.test_id AND tests.is_active = true
  ));

CREATE POLICY "Admins can view all questions"
  ON public.questions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create questions"
  ON public.questions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for reading_passages table
CREATE POLICY "Users can view passages for active tests"
  ON public.reading_passages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tests 
    WHERE tests.id = reading_passages.test_id AND tests.is_active = true
  ));

CREATE POLICY "Admins can view all passages"
  ON public.reading_passages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create passages"
  ON public.reading_passages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update passages"
  ON public.reading_passages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete passages"
  ON public.reading_passages FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for audio_files table
CREATE POLICY "Users can view audio for active tests"
  ON public.audio_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tests 
    WHERE tests.id = audio_files.test_id AND tests.is_active = true
  ));

CREATE POLICY "Admins can view all audio"
  ON public.audio_files FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create audio"
  ON public.audio_files FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update audio"
  ON public.audio_files FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete audio"
  ON public.audio_files FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_passages_updated_at
  BEFORE UPDATE ON public.reading_passages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio bucket
CREATE POLICY "Anyone can view audio files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio');

CREATE POLICY "Admins can upload audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update audio files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'audio' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete audio files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio' AND has_role(auth.uid(), 'admin'));