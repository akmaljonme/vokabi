-- ═══════════════════════════════════════════════════════════════
-- Kunlik faollik eslatmasi (retention reminder) tizimi
--
-- Foydalanuvchi bugun hali mashq qilmagan bo'lsa (streak xavf ostida),
-- va u Telegram bot orqali telefon raqamini ulagan bo'lsa,
-- unga avtomatik eslatma yuboriladi. Bu 'send-retention-reminders'
-- edge funksiyasi tomonidan har kuni pg_cron orqali chaqiriladi.
-- ═══════════════════════════════════════════════════════════════

-- Zarur kengaytmalar (rejalashtirilgan vazifalar uchun)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Bir kunda bir foydalanuvchiga bir marta yuborilganini kuzatish
CREATE TABLE IF NOT EXISTS public.retention_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, sent_date)
);

ALTER TABLE public.retention_reminders_sent ENABLE ROW LEVEL SECURITY;
-- Faqat service_role (edge function) yoza oladi, oddiy klient kira olmaydi
CREATE POLICY "no client access" ON public.retention_reminders_sent
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
GRANT ALL ON public.retention_reminders_sent TO service_role;

-- Bugun faol bo'lmagan, Telegram ulangan va eslatmalarni
-- o'chirmagan foydalanuvchilarni topuvchi funksiya
CREATE OR REPLACE FUNCTION public.get_inactive_users_with_telegram()
RETURNS TABLE(user_id uuid, full_name text, chat_id bigint, current_streak int, xp int)
LANGUAGE sql SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT up.user_id, p.full_name, tpl.chat_id, up.current_streak, up.xp
  FROM public.user_progress up
  JOIN public.profiles p ON p.user_id = up.user_id
  JOIN auth.users u ON u.id = up.user_id
  JOIN public.telegram_phone_links tpl ON tpl.phone = '+' || u.phone
  WHERE u.phone IS NOT NULL
    AND (up.last_activity_date IS NULL OR up.last_activity_date < CURRENT_DATE)
    AND COALESCE(p.test_reminders, true) = true
    AND NOT EXISTS (
      SELECT 1 FROM public.retention_reminders_sent r
      WHERE r.user_id = up.user_id AND r.sent_date = CURRENT_DATE
    );
$$;

-- Faqat service_role chaqira oladi (edge function orqali)
REVOKE EXECUTE ON FUNCTION public.get_inactive_users_with_telegram() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inactive_users_with_telegram() TO service_role;
