-- Bio for Instagram-style profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Comments on posts
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON public.post_comments FOR SELECT USING (true);

CREATE POLICY "Users can comment as themselves"
  ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at);

-- Saved posts (bookmark) — private to the saver
CREATE TABLE IF NOT EXISTS public.post_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_saves_unique unique (post_id, user_id)
);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saves"
  ON public.post_saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save as themselves"
  ON public.post_saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own saves"
  ON public.post_saves FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_saves_user ON public.post_saves(user_id);
