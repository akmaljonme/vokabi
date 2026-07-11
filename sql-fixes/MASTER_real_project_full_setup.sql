-- ═══════════════════════════════════════════════════════════════════════
-- Vokabi — TO'LIQ SQL Editor skripti (haqiqiy production loyiha uchun)
--
-- Supabase Dashboard → SQL Editor → shu faylni TO'LIQ nusxalab, "Run"
-- tugmasini bosing. To'liq idempotent — xavfsiz, xato bermaydi, qayta
-- ishga tushirish mumkin.
--
-- Bu skript shu suhbat davomida qurilgan BARCHA funksiyalarni qamrab
-- oladi:
--   1) shared_tests / shared_test_results  ("Test topilmadi" xatosi)
--   2) friend_challenges                   (Do'stlarga challenge)
--   3) notifications / follows / posts /
--      post_likes / poll_votes + storage    (Bildirishnomalar, Follow, Feed)
--   4) profiles.bio / post_comments /
--      post_saves                           (Instagram uslubidagi profil)
--   5) broadcast_notification()             (Barcha foydalanuvchiga xabar)
--
-- MUHIM: bu skriptni albatta HAQIQIY production loyihangizda
-- (jjepvaavxdddbjmqrytc — .env faylingizdagi VITE_SUPABASE_PROJECT_ID)
-- ishga tushiring, boshqa (eski/tashlab yuborilgan) loyihada emas.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1) shared_tests / shared_test_results
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shared_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  level TEXT NOT NULL,
  skill TEXT NOT NULL,
  mock_id INTEGER,
  title TEXT,
  questions JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

ALTER TABLE public.shared_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read shared tests" ON public.shared_tests;
CREATE POLICY "Anyone can read shared tests" ON public.shared_tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create" ON public.shared_tests;
CREATE POLICY "Authenticated users can create" ON public.shared_tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.increment_test_views(test_uuid UUID)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.shared_tests SET view_count = view_count + 1 WHERE id = test_uuid;
$$;

CREATE TABLE IF NOT EXISTS public.shared_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_test_id UUID REFERENCES public.shared_tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  cheated BOOLEAN DEFAULT FALSE,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shared_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert results" ON public.shared_test_results;
CREATE POLICY "Anyone can insert results" ON public.shared_test_results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read results" ON public.shared_test_results;
CREATE POLICY "Admin can read results" ON public.shared_test_results FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_shared_test_results_test_id ON public.shared_test_results(shared_test_id);


-- ───────────────────────────────────────────────────────────────
-- 2) friend_challenges (do'stlarga challenge tashlash)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.friend_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill text NOT NULL DEFAULT 'vocabulary',
  status text NOT NULL DEFAULT 'pending',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  challenger_score integer,
  opponent_score integer,
  challenger_completed_at timestamptz,
  opponent_completed_at timestamptz,
  winner_id uuid REFERENCES auth.users(id),
  challenger_bonus_claimed boolean NOT NULL DEFAULT false,
  opponent_bonus_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '3 days'),
  CONSTRAINT friend_challenges_not_self CHECK (challenger_id <> opponent_id)
);

ALTER TABLE public.friend_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their challenges" ON public.friend_challenges;
CREATE POLICY "Participants can view their challenges" ON public.friend_challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

DROP POLICY IF EXISTS "Users can create challenges as challenger" ON public.friend_challenges;
CREATE POLICY "Users can create challenges as challenger" ON public.friend_challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

DROP POLICY IF EXISTS "Participants can update their challenges" ON public.friend_challenges;
CREATE POLICY "Participants can update their challenges" ON public.friend_challenges FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id)
  WITH CHECK (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE INDEX IF NOT EXISTS idx_friend_challenges_opponent ON public.friend_challenges(opponent_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_challenges_challenger ON public.friend_challenges(challenger_id, status);


-- ───────────────────────────────────────────────────────────────
-- 3) notifications / follows / posts / post_likes / poll_votes
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications for others" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications for others" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);


CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follow graph" ON public.follows;
CREATE POLICY "Anyone can view follow graph" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow as themselves" ON public.follows;
CREATE POLICY "Users can follow as themselves" ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow their own follows" ON public.follows;
CREATE POLICY "Users can unfollow their own follows" ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);


CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'post',
  caption text,
  media_url text,
  media_type text,
  poll_options jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like as themselves" ON public.post_likes;
CREATE POLICY "Users can like as themselves" ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.post_likes;
CREATE POLICY "Users can unlike their own likes" ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);


CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view poll votes" ON public.poll_votes;
CREATE POLICY "Anyone can view poll votes" ON public.poll_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote as themselves" ON public.poll_votes;
CREATE POLICY "Users can vote as themselves" ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_post ON public.poll_votes(post_id);


-- Storage bucket for post/reel images & videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts-media', 'posts-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view posts media" ON storage.objects;
CREATE POLICY "Anyone can view posts media" ON storage.objects FOR SELECT
  USING (bucket_id = 'posts-media');

DROP POLICY IF EXISTS "Users can upload posts media to own folder" ON storage.objects;
CREATE POLICY "Users can upload posts media to own folder" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own posts media" ON storage.objects;
CREATE POLICY "Users can delete own posts media" ON storage.objects FOR DELETE
  USING (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = (auth.uid())::text);


-- ───────────────────────────────────────────────────────────────
-- 4) profiles.bio / post_comments / post_saves (Instagram profil)
-- ───────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can comment as themselves" ON public.post_comments;
CREATE POLICY "Users can comment as themselves" ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at);


CREATE TABLE IF NOT EXISTS public.post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_saves_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saves" ON public.post_saves;
CREATE POLICY "Users can view their own saves" ON public.post_saves FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save as themselves" ON public.post_saves;
CREATE POLICY "Users can save as themselves" ON public.post_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave their own saves" ON public.post_saves;
CREATE POLICY "Users can unsave their own saves" ON public.post_saves FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_saves_user ON public.post_saves(user_id);


-- ───────────────────────────────────────────────────────────────
-- 5) broadcast_notification() — admin-only, barcha foydalanuvchiga xabar
--    (has_role() va public.profiles jadvali allaqachon mavjud bo'lishi shart)
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.broadcast_notification(p_title text, p_body text, p_type text DEFAULT 'announcement')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Faqat administrator barcha foydalanuvchilarga xabar yubora oladi';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body)
  SELECT user_id, p_type, p_title, p_body FROM public.profiles;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.broadcast_notification(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text, text) TO authenticated;


-- ───────────────────────────────────────────────────────────────
-- 6) Tekshirish — natijada 10 qator ko'rinishi kerak
-- ───────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'shared_tests', 'shared_test_results', 'friend_challenges',
    'notifications', 'follows', 'posts', 'post_likes', 'poll_votes',
    'post_comments', 'post_saves'
  )
ORDER BY table_name;
