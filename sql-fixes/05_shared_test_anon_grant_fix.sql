-- ═══════════════════════════════════════════════════════════════
-- MUAMMO: havoladan kirsa "Test topilmadi" — FAQAT tizimga
-- kirmagan (anon) foydalanuvchida
--
-- SABAB: RLS siyosati "hammaga ruxsat" (USING (true)) bo'lsa ham,
-- PostgreSQL'da jadvalga umuman kirish uchun ALOHIDA asosiy GRANT
-- kerak. RLS faqat GRANT allaqachon bergan narsani cheklaydi — agar
-- GRANT umuman bo'lmasa, RLS "true" bo'lsa ham hech narsa ko'rinmaydi.
-- SQL Editor orqali yaratilgan jadvallarda bu GRANT ba'zan avtomatik
-- berilmay qoladi (ayniqsa anon roli uchun).
--
-- Bu skript aynan shu yetishmayotgan ruxsatlarni beradi.
-- Idempotent — xavfsiz qayta ishga tushirish mumkin.
-- ═══════════════════════════════════════════════════════════════

-- Asosiy GRANT'lar (bu yetishmayotgan bo'lishi mumkin edi)
GRANT SELECT ON public.shared_tests TO anon, authenticated;
GRANT INSERT ON public.shared_tests TO authenticated;
GRANT SELECT, INSERT ON public.shared_test_results TO anon, authenticated;

-- RLS siyosatlarini qayta tasdiqlaymiz (xavfsizlik uchun)
ALTER TABLE public.shared_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read shared tests" ON public.shared_tests;
CREATE POLICY "Anyone can read shared tests" ON public.shared_tests
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create" ON public.shared_tests;
CREATE POLICY "Authenticated users can create" ON public.shared_tests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.shared_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert results" ON public.shared_test_results;
CREATE POLICY "Anyone can insert results" ON public.shared_test_results
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read results" ON public.shared_test_results;
CREATE POLICY "Admin can read results" ON public.shared_test_results
  FOR SELECT TO anon, authenticated USING (true);

-- increment_test_views funksiyasini SECURITY DEFINER qilamiz, shunda
-- u chaqiruvchining (anon ham) UPDATE ruxsati yo'qligidan qat'i nazar ishlaydi
CREATE OR REPLACE FUNCTION public.increment_test_views(test_uuid UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_tests SET view_count = view_count + 1 WHERE id = test_uuid;
$$;

REVOKE ALL ON FUNCTION public.increment_test_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_test_views(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- TEKSHIRISH: bu so'rov natijasida "anon" qatorida SELECT
-- ko'rinishi SHART. Agar ko'rinmasa, GRANT hali ham qo'llanmagan.
-- ─────────────────────────────────────────────────────────────
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('shared_tests', 'shared_test_results')
  AND table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type = 'SELECT'
ORDER BY table_name, grantee;
