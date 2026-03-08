
-- Chat rooms (public rooms by level)
CREATE TABLE public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  level text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view rooms" ON public.chat_rooms
  FOR SELECT TO authenticated USING (true);

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Direct messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DMs" ON public.direct_messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send DMs" ON public.direct_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received DMs" ON public.direct_messages
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Insert default chat rooms
INSERT INTO public.chat_rooms (name, description, level) VALUES
  ('🌍 General', 'Umumiy suhbat - barcha darajalar uchun', 'general'),
  ('🟢 A1-A2 Beginners', 'Boshlang''ich daraja uchun', 'A1-A2'),
  ('🟡 B1-B2 Intermediate', 'O''rta daraja uchun', 'B1-B2'),
  ('🔴 C1-C2 Advanced', 'Yuqori daraja uchun', 'C1-C2'),
  ('📚 IELTS Preparation', 'IELTS tayyorgarlik suhbatlari', 'IELTS');

-- Game scores table
CREATE TABLE public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_type text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'A1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all scores" ON public.game_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own scores" ON public.game_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
