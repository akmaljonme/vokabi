-- Tournament daily tasks tracker (4 skills + mystery box)
CREATE TABLE public.tournament_daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  reading_done boolean NOT NULL DEFAULT false,
  listening_done boolean NOT NULL DEFAULT false,
  writing_done boolean NOT NULL DEFAULT false,
  speaking_done boolean NOT NULL DEFAULT false,
  box_opened boolean NOT NULL DEFAULT false,
  box_result text,
  daily_xp integer NOT NULL DEFAULT 0,
  committed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, tournament_id, task_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_daily_progress TO authenticated;
GRANT ALL ON public.tournament_daily_progress TO service_role;

ALTER TABLE public.tournament_daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own daily progress"
  ON public.tournament_daily_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily progress"
  ON public.tournament_daily_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily progress"
  ON public.tournament_daily_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tournament_daily_progress_updated_at
  BEFORE UPDATE ON public.tournament_daily_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();