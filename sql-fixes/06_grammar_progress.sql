-- ═══════════════════════════════════════════════════════════════
-- Grammar Hub — SQL Editor uchun
-- Supabase Dashboard → SQL Editor → to'liq nusxalab → Run
-- Idempotent — xavfsiz qayta ishga tushirish mumkin.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.grammar_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_key text not null,
  score integer not null,
  total integer not null,
  completed_at timestamptz not null default now(),
  constraint grammar_progress_unique unique (user_id, topic_key)
);

alter table public.grammar_progress enable row level security;

drop policy if exists "Users can view their own grammar progress" on public.grammar_progress;
create policy "Users can view their own grammar progress"
  on public.grammar_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert their own grammar progress" on public.grammar_progress;
create policy "Users can upsert their own grammar progress"
  on public.grammar_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own grammar progress" on public.grammar_progress;
create policy "Users can update their own grammar progress"
  on public.grammar_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.grammar_progress to authenticated;

create index if not exists idx_grammar_progress_user on public.grammar_progress(user_id);

-- Tekshirish
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'grammar_progress';

select grantee, privilege_type from information_schema.role_table_grants
where table_name = 'grammar_progress' and grantee = 'authenticated';
