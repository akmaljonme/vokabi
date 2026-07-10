-- ═══════════════════════════════════════════════════════════════
-- MUAMMO 3: "Joylashda xatolik yuz berdi" (Feed'da post/reel/poll
--           joylashda)
-- ═══════════════════════════════════════════════════════════════
--
-- HOLAT: Production bazani to'liq tekshirdim —
--   ✅ public.posts jadvali mavjud, barcha ustunlar to'g'ri
--   ✅ RLS yoqilgan, INSERT siyosati to'g'ri (auth.uid() = user_id)
--   ✅ storage.buckets ichida 'posts-media' bucket mavjud, public=true
--   ✅ storage.objects uchun SELECT/INSERT/DELETE siyosatlari to'g'ri
--   ✅ Fayl hajmi/MIME cheklovi yo'q
--
-- SQL/RLS darajasida aniq xato topilmadi — schema to'g'ri sozlangan.
-- Shuning uchun bu faylda faqat XAVFSIZ QAYTA QO'LLASH (idempotent)
-- skripti berilmoqda — agar sizning muhitingizda biror narsa
-- qo'llanilmagan bo'lsa, shuni ishga tushiring:
--
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'post',
  caption text,
  media_url text,
  media_type text,
  poll_options jsonb,
  created_at timestamptz not null default now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts-media', 'posts-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view posts media" ON storage.objects;
CREATE POLICY "Anyone can view posts media" ON storage.objects FOR SELECT USING (bucket_id = 'posts-media');

DROP POLICY IF EXISTS "Users can upload posts media to own folder" ON storage.objects;
CREATE POLICY "Users can upload posts media to own folder" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own posts media" ON storage.objects;
CREATE POLICY "Users can delete own posts media" ON storage.objects FOR DELETE
  USING (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- ─────────────────────────────────────────────────────────────
-- Agar shuni ishga tushirgandan keyin ham xato davom etsa:
-- kod endi ANIQ xato matnini ko'rsatadi (masalan "Fayl yuklashda
-- xato: ..." yoki "Post saqlashda xato: ..."). Shu matnni ayting —
-- aynan qaysi qadam (fayl yuklash yoki bazaga yozish) va nima
-- sababdan xato berayotganini bilib olamiz.
-- ─────────────────────────────────────────────────────────────
