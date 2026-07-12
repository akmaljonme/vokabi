-- ═══════════ STORIES (24-soatlik vaqtinchalik kontent) ═══════════
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image', -- image | video
  caption text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.stories enable row level security;

create policy "Anyone can view non-expired stories"
  on public.stories for select
  using (expires_at > now());

create policy "Users can create their own stories"
  on public.stories for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own stories"
  on public.stories for delete
  using (auth.uid() = user_id);

create index if not exists idx_stories_user on public.stories(user_id, expires_at);
create index if not exists idx_stories_expires on public.stories(expires_at);

-- ═══════════ STORY VIEWS ═══════════
create table if not exists public.story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  constraint story_views_unique unique (story_id, viewer_id)
);

alter table public.story_views enable row level security;

create policy "Viewers can see their own view records"
  on public.story_views for select
  using (auth.uid() = viewer_id);

create policy "Story owners can see who viewed their stories"
  on public.story_views for select
  using (exists (select 1 from public.stories s where s.id = story_views.story_id and s.user_id = auth.uid()));

create policy "Users can record their own views"
  on public.story_views for insert
  with check (auth.uid() = viewer_id);

create index if not exists idx_story_views_story on public.story_views(story_id);
create index if not exists idx_story_views_viewer on public.story_views(viewer_id);
