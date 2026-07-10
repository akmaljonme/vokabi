-- ═══════════════════════════════════════════════════════════════
-- Vokabi — SQL Editor uchun tayyor skript
-- Supabase Dashboard → SQL Editor → shu faylni to'liq nusxalab,
-- "Run" tugmasini bosing. Idempotent — xavfsiz, xato bermaydi,
-- allaqachon qo'llangan bo'lsa ham qayta ishga tushirish mumkin.
--
-- Eslatma: "Savollarni tuzib bo'lmadi" xatosi SQL muammosi emas edi
-- (frontend kodidagi xato allaqachon tuzatilgan) — shu sabab bu
-- skriptda yo'q.
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1) shared_tests / shared_test_results ("Test topilmadi" xatosi)
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
-- 2) posts / posts-media ("Joylashda xatolik yuz berdi" xatosi)
-- ───────────────────────────────────────────────────────────────

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
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

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
CREATE POLICY "Users can like as themselves" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.post_likes;
CREATE POLICY "Users can unlike their own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

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
CREATE POLICY "Users can vote as themselves" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_post ON public.poll_votes(post_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts-media', 'posts-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view posts media" ON storage.objects;
CREATE POLICY "Anyone can view posts media" ON storage.objects FOR SELECT USING (bucket_id = 'posts-media');

DROP POLICY IF EXISTS "Users can upload posts media to own folder" ON storage.objects;
CREATE POLICY "Users can upload posts media to own folder" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own posts media" ON storage.objects;
CREATE POLICY "Users can delete own posts media" ON storage.objects FOR DELETE
  USING (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = (auth.uid())::text);


-- ───────────────────────────────────────────────────────────────
-- 3) Tekshirish — natijada 5 ta jadval nomi ko'rinishi kerak
-- ───────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shared_tests', 'shared_test_results', 'posts', 'post_likes', 'poll_votes')
ORDER BY table_name;
