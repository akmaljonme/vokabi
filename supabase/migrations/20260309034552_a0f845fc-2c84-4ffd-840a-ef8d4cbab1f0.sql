
-- Daily challenges table
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  challenge_type text NOT NULL DEFAULT 'vocabulary',
  title text NOT NULL,
  description text NOT NULL,
  challenge_data jsonb NOT NULL DEFAULT '{}',
  xp_reward integer NOT NULL DEFAULT 50,
  difficulty text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User daily challenge completions
CREATE TABLE public.user_daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  score integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  streak_multiplier numeric(3,1) NOT NULL DEFAULT 1.0,
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone authenticated can view daily challenges
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges FOR SELECT TO authenticated USING (true);

-- RLS: Users can view own completions
CREATE POLICY "Users can view own completions" ON public.user_daily_challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS: Users can insert own completions
CREATE POLICY "Users can insert own completions" ON public.user_daily_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Unique constraint on challenge_date to ensure one set per day
CREATE UNIQUE INDEX daily_challenges_date_type_idx ON public.daily_challenges(challenge_date, challenge_type);
