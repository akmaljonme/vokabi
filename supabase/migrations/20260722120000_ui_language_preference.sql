-- Sayt interfeysi tili (o'rganilayotgan chet tilidan farqli — target_language)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_language text NOT NULL DEFAULT 'uz';

COMMENT ON COLUMN public.profiles.ui_language IS
  'Interfeys (UI) tili: uz | ru | en | kaa (uz=o''zbekcha, ru=ruscha, en=inglizcha, kaa=qoraqalpoqcha)';

CREATE INDEX IF NOT EXISTS idx_profiles_ui_language ON public.profiles(ui_language);
