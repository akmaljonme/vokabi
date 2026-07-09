-- Friend-to-friend head-to-head challenges
create table if not exists public.friend_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  skill text not null default 'vocabulary',
  status text not null default 'pending', -- pending | declined | active | completed | expired
  questions jsonb not null default '[]'::jsonb,
  challenger_score integer,
  opponent_score integer,
  challenger_completed_at timestamptz,
  opponent_completed_at timestamptz,
  winner_id uuid references auth.users(id),
  challenger_bonus_claimed boolean not null default false,
  opponent_bonus_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 days'),
  constraint friend_challenges_not_self check (challenger_id <> opponent_id)
);

alter table public.friend_challenges enable row level security;

create policy "Participants can view their challenges"
  on public.friend_challenges for select
  using (auth.uid() = challenger_id or auth.uid() = opponent_id);

create policy "Users can create challenges as challenger"
  on public.friend_challenges for insert
  with check (auth.uid() = challenger_id);

create policy "Participants can update their challenges"
  on public.friend_challenges for update
  using (auth.uid() = challenger_id or auth.uid() = opponent_id)
  with check (auth.uid() = challenger_id or auth.uid() = opponent_id);

create index if not exists idx_friend_challenges_opponent on public.friend_challenges(opponent_id, status);
create index if not exists idx_friend_challenges_challenger on public.friend_challenges(challenger_id, status);
