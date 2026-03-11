
-- Weekly tournaments table
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  game_type text NOT NULL DEFAULT 'all',
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'active',
  prize_xp integer NOT NULL DEFAULT 500,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT TO authenticated USING (true);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  total_score integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.tournament_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join tournaments" ON public.tournament_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores" ON public.tournament_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Friends system
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships" ON public.friendships
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Daily game quests
CREATE TABLE public.daily_game_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_date date NOT NULL DEFAULT CURRENT_DATE,
  quest_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_value integer NOT NULL DEFAULT 3,
  xp_reward integer NOT NULL DEFAULT 30,
  game_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_game_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quests" ON public.daily_game_quests
  FOR SELECT TO authenticated USING (true);

-- User quest progress
CREATE TABLE public.user_quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_id uuid REFERENCES public.daily_game_quests(id) ON DELETE CASCADE NOT NULL,
  current_value integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_quest_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_quest_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_quest_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
