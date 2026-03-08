-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'dm',
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reactions" ON public.message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add own reactions" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add forwarded_from column to both message tables
ALTER TABLE public.direct_messages ADD COLUMN forwarded_from text;
ALTER TABLE public.chat_messages ADD COLUMN forwarded_from text;

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;