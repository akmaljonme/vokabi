-- ═══════════════════════════════════════════════════════════════
-- MUAMMO 2: "Test topilmadi" — shared-test havolasi ochilmayapti
-- ═══════════════════════════════════════════════════════════════
--
-- SABAB: shared_tests va shared_test_results jadvallari, shuningdek
-- increment_test_views() funksiyasi repo ichida SQL fayl sifatida
-- yozilgan edi, lekin HECH QACHON production bazaga qo'llanilmagan edi.
--
-- HOLAT: Bu SQL allaqachon production bazaga qo'llandi (2026-07-09).
-- Quyida — aynan o'sha qo'llangan SQL, arxiv/tekshiruv uchun.
-- Idempotent (IF NOT EXISTS / OR REPLACE) — xavfsiz qayta ishga
-- tushirish mumkin, xato bermaydi.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.shared_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  level TEXT NOT NULL,
  skill TEXT NOT NULL,
  mock_id INTEGER,
  title TEXT,
  questions JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

ALTER TABLE public.shared_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read shared tests" ON public.shared_tests;
CREATE POLICY "Anyone can read shared tests" ON public.shared_tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create" ON public.shared_tests;
CREATE POLICY "Authenticated users can create" ON public.shared_tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.increment_test_views(test_uuid UUID)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.shared_tests SET view_count = view_count + 1 WHERE id = test_uuid;
$$;

CREATE TABLE IF NOT EXISTS public.shared_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_test_id UUID REFERENCES public.shared_tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  cheated BOOLEAN DEFAULT FALSE,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shared_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert results" ON public.shared_test_results;
CREATE POLICY "Anyone can insert results" ON public.shared_test_results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read results" ON public.shared_test_results;
CREATE POLICY "Admin can read results" ON public.shared_test_results FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_shared_test_results_test_id ON public.shared_test_results(shared_test_id);

-- Tekshirish uchun (natija bo'sh bo'lmasligi kerak):
-- select table_name from information_schema.tables where table_name in ('shared_tests','shared_test_results');
