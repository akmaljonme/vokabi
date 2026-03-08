
-- User progress tracking (XP, streak, level)
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  tests_completed integer NOT NULL DEFAULT 0,
  total_study_time integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.user_progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Achievements system
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  xp_reward integer NOT NULL DEFAULT 50,
  category text NOT NULL DEFAULT 'general',
  threshold integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- User achievements (unlocked)
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Leaderboard view (public, top users by XP)
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 20)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, xp integer, level integer, current_streak integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT up.user_id, p.full_name, p.avatar_url, up.xp, up.level, up.current_streak
  FROM public.user_progress up
  LEFT JOIN public.profiles p ON p.user_id = up.user_id
  ORDER BY up.xp DESC
  LIMIT limit_count
$$;

-- Insert default achievements
INSERT INTO public.achievements (key, title, description, icon, xp_reward, category, threshold) VALUES
  ('first_test', 'Birinchi Qadam', 'Birinchi testni topshiring', '🎯', 50, 'milestone', 1),
  ('streak_3', 'Doimiy Harakat', '3 kunlik streak ga erishing', '🔥', 100, 'streak', 3),
  ('streak_7', 'Haftalik Chempion', '7 kunlik streak ga erishing', '⚡', 200, 'streak', 7),
  ('streak_30', 'Oy Yulduzi', '30 kunlik streak ga erishing', '🌟', 500, 'streak', 30),
  ('tests_5', 'Faol O''quvchi', '5 ta test topshiring', '📚', 100, 'milestone', 5),
  ('tests_25', 'Test Masteri', '25 ta test topshiring', '🎓', 300, 'milestone', 25),
  ('tests_100', 'Legenda', '100 ta test topshiring', '👑', 1000, 'milestone', 100),
  ('perfect_score', 'Mukammal Natija', '100% natija oling', '💎', 200, 'performance', 100),
  ('level_5', 'O''sish Yo''lida', '5-darajaga erishing', '🚀', 150, 'level', 5),
  ('level_10', 'Pro Daraja', '10-darajaga erishing', '🏆', 500, 'level', 10),
  ('all_skills', 'Universal Talant', 'Barcha 4 ta ko''nikmani sinab ko''ring', '🌈', 200, 'variety', 4),
  ('speed_demon', 'Tezkor', 'Testni yarim vaqtda yakunlang', '⏱️', 150, 'performance', 1);
