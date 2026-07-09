-- ═══════════ NOTIFICATIONS ═══════════
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null, -- friend_request | friend_accepted | follow | challenge_invite | challenge_result | achievement | like | poll_vote
  title text not null,
  body text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Authenticated users can create notifications for others"
  on public.notifications for insert
  with check (auth.uid() is not null);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- ═══════════ FOLLOWS (Instagram-style, one-directional) ═══════════
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_not_self check (follower_id <> following_id),
  constraint follows_unique unique (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Anyone can view follow graph"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow their own follows"
  on public.follows for delete
  using (auth.uid() = follower_id);

create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- ═══════════ POSTS (post | reel | poll) ═══════════
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'post', -- post | reel | poll
  caption text,
  media_url text,
  media_type text, -- image | video
  poll_options jsonb, -- [{"text": "..."}]
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Anyone can view posts"
  on public.posts for select
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

create index if not exists idx_posts_created on public.posts(created_at desc);
create index if not exists idx_posts_user on public.posts(user_id, created_at desc);

-- ═══════════ POST LIKES ═══════════
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_unique unique (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Anyone can view likes"
  on public.post_likes for select
  using (true);

create policy "Users can like as themselves"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on public.post_likes for delete
  using (auth.uid() = user_id);

create index if not exists idx_post_likes_post on public.post_likes(post_id);

-- ═══════════ POLL VOTES ═══════════
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index integer not null,
  created_at timestamptz not null default now(),
  constraint poll_votes_unique unique (post_id, user_id)
);

alter table public.poll_votes enable row level security;

create policy "Anyone can view poll votes"
  on public.poll_votes for select
  using (true);

create policy "Users can vote as themselves"
  on public.poll_votes for insert
  with check (auth.uid() = user_id);

create index if not exists idx_poll_votes_post on public.poll_votes(post_id);

-- ═══════════ STORAGE: posts-media bucket (images + reel videos) ═══════════
insert into storage.buckets (id, name, public)
values ('posts-media', 'posts-media', true)
on conflict (id) do nothing;

create policy "Anyone can view posts media"
  on storage.objects for select
  using (bucket_id = 'posts-media');

create policy "Users can upload posts media to own folder"
  on storage.objects for insert
  with check (bucket_id = 'posts-media' and (storage.foldername(name))[1] = (auth.uid())::text);

create policy "Users can delete own posts media"
  on storage.objects for delete
  using (bucket_id = 'posts-media' and (storage.foldername(name))[1] = (auth.uid())::text);
