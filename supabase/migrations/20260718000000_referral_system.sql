-- Har bir foydalanuvchiga o'zining doimiy referral kodini beramiz
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referral_rewards_granted integer not null default 0;

create or replace function public.generate_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if NEW.referral_code is null then
    loop
      new_code := 'VKB' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (select 1 from public.profiles where referral_code = new_code);
    end loop;
    NEW.referral_code := new_code;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_generate_referral_code on public.profiles;
create trigger trg_generate_referral_code
  before insert on public.profiles
  for each row execute function public.generate_referral_code();

-- Mavjud foydalanuvchilarga ham kod beramiz
update public.profiles set referral_code = 'VKB' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
where referral_code is null;

-- Kim kimni taklif qilgani (audit + hisoblash uchun)
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint referrals_referred_unique unique (referred_id),
  constraint referrals_not_self check (referrer_id <> referred_id)
);

alter table public.referrals enable row level security;

create policy "Users can view referrals involving them"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "New users can record who referred them"
  on public.referrals for insert
  with check (auth.uid() = referred_id);

grant select, insert on public.referrals to authenticated;

create index if not exists idx_referrals_referrer on public.referrals(referrer_id);

-- Har 10 ta taklif uchun 1 oylik Pro beramiz (avtomatik, real vaqtda)
create or replace function public.handle_new_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_granted integer;
  v_target integer;
  v_months integer;
  v_current_expiry timestamptz;
begin
  select count(*) into v_total from public.referrals where referrer_id = NEW.referrer_id;
  select coalesce(referral_rewards_granted, 0) into v_granted from public.profiles where user_id = NEW.referrer_id;

  v_target := v_total / 10;

  if v_target > v_granted then
    v_months := v_target - v_granted;

    select expires_at into v_current_expiry from public.subscriptions where user_id = NEW.referrer_id;

    insert into public.subscriptions (user_id, plan, expires_at, assigned_by)
    values (
      NEW.referrer_id,
      'pro',
      greatest(now(), coalesce(v_current_expiry, now())) + (v_months || ' months')::interval,
      NEW.referrer_id
    )
    on conflict (user_id) do update set
      plan = 'pro',
      expires_at = greatest(now(), coalesce(subscriptions.expires_at, now())) + (v_months || ' months')::interval,
      updated_at = now();

    update public.profiles set referral_rewards_granted = v_target where user_id = NEW.referrer_id;

    insert into public.notifications (user_id, type, title, body)
    values (
      NEW.referrer_id,
      'achievement',
      '🎉 Siz Pro rejani yutib oldingiz!',
      v_months || ' oylik Pro reja hisobingizga qo''shildi — ' || (v_target * 10) || ' ta do''stingizni taklif qilganingiz uchun!'
    );
  else
    insert into public.notifications (user_id, type, title, body)
    values (
      NEW.referrer_id,
      'follow',
      'Yangi do''stingiz qo''shildi! 🎉',
      'Havolangiz orqali ro''yxatdan o''tdi. ' || v_total || '/10 — Pro rejagacha ' || (10 - (v_total % 10)) || ' ta qoldi!'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_handle_new_referral on public.referrals;
create trigger trg_handle_new_referral
  after insert on public.referrals
  for each row execute function public.handle_new_referral();

revoke all on function public.generate_referral_code() from public, anon, authenticated;
revoke all on function public.handle_new_referral() from public, anon, authenticated;
