-- Telefon raqamni Telegram chat_id bilan bog'lash (bot orqali /start -> raqam ulashilganda yoziladi)
create table if not exists public.telegram_phone_links (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  chat_id bigint not null,
  username text,
  first_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.telegram_phone_links enable row level security;
-- Qasddan hech qanday client-facing policy yo'q — faqat edge funksiyalar (service role) yoza/o'qiy oladi.

create index if not exists idx_telegram_phone_links_phone on public.telegram_phone_links(phone);

-- Bir martalik kirish kodlari (hash qilingan holda saqlanadi)
create table if not exists public.phone_otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.phone_otp_codes enable row level security;
-- Xuddi shunday — faqat service role orqali (send-phone-otp / verify-phone-otp edge funksiyalari).

create index if not exists idx_phone_otp_codes_phone on public.phone_otp_codes(phone, created_at desc);
