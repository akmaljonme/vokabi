-- User language learning preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_language   text DEFAULT 'english',
  ADD COLUMN IF NOT EXISTS learning_purpose  text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_level     text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS learning_goal     text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_done   boolean NOT NULL DEFAULT false;

-- Supported languages
COMMENT ON COLUMN public.profiles.target_language IS
  'english | chinese | german | french | spanish | japanese | korean | arabic | russian';

COMMENT ON COLUMN public.profiles.learning_purpose IS
  'travel | work | study | exam | hobby | migration';

COMMENT ON COLUMN public.profiles.learning_goal IS
  'ielts | cefr | conversation | business | kids | general';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_language ON public.profiles(target_language);
