
-- Game rooms for Last Word multiplayer
CREATE TABLE public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  player1_id uuid NOT NULL,
  player2_id uuid,
  player1_name text NOT NULL DEFAULT 'Player 1',
  player2_name text,
  player1_score integer NOT NULL DEFAULT 0,
  player2_score integer NOT NULL DEFAULT 0,
  current_turn uuid,
  current_word text,
  used_words jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_move_at timestamptz DEFAULT now(),
  round integer NOT NULL DEFAULT 0,
  winner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view rooms (for matchmaking)
CREATE POLICY "Anyone can view game rooms" ON public.game_rooms
  FOR SELECT TO authenticated USING (true);

-- Users can create rooms
CREATE POLICY "Users can create rooms" ON public.game_rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = player1_id);

-- Players in room can update
CREATE POLICY "Players can update own rooms" ON public.game_rooms
  FOR UPDATE TO authenticated USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Players can delete their waiting rooms
CREATE POLICY "Players can delete waiting rooms" ON public.game_rooms
  FOR DELETE TO authenticated USING (auth.uid() = player1_id AND status = 'waiting');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
