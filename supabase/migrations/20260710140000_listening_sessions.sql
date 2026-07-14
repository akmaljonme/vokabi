create table if not exists public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null,
  category text not null,
  score integer not null,
  total integer not null,
  created_at timestamptz not null default now()
);

alter table public.listening_sessions enable row level security;

create policy "Users can view their own listening sessions"
  on public.listening_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own listening sessions"
  on public.listening_sessions for insert
  with check (auth.uid() = user_id);

grant select, insert on public.listening_sessions to authenticated;

create index if not exists idx_listening_sessions_user on public.listening_sessions(user_id, created_at desc);
