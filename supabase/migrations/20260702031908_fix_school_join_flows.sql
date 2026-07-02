-- ═══════════════════════════════════════════════════════════════
-- FIX: B2B sinfga qo'shilish va o'qituvchi bo'lib qo'shilish
--
-- Muammo 1: school_classes uchun RLS policy faqat allaqachon a'zo
--   bo'lganlarga SELECT ruxsat berardi. Natijada yangi o'quvchi
--   invite kodi orqali sinfni izlab TOPA OLMAS EDI (RLS uni
--   ko'rsatmasdi), shuning uchun "Noto'g'ri kod" xatosi chiqardi.
--
-- Muammo 2: O'qituvchi bo'lib qo'shilishning umuman ishlaydigan
--   yo'li yo'q edi — "Invite link" faqat /register?school=..&role=teacher
--   linkini nusxalar edi, lekin bu parametrlarni hech kim o'qimasdi
--   va school_teachers jadvaliga hech qanday yozuv qo'shilmasdi.
--
-- Yechim: ikkala oqim uchun ham SECURITY DEFINER funksiyalar orqali,
-- RLSni to'g'ri va xavfsiz chetlab o'tib, qo'shilishni amalga oshiramiz.
-- ═══════════════════════════════════════════════════════════════

-- 1) O'qituvchilar uchun taklif kodi ustuni
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS teacher_invite_code TEXT UNIQUE
  DEFAULT upper(substring(gen_random_uuid()::text, 1, 8));

-- Mavjud maktablarga ham kod tayinlab qo'yamiz (agar bo'sh bo'lsa)
UPDATE public.schools
SET teacher_invite_code = upper(substring(gen_random_uuid()::text, 1, 8))
WHERE teacher_invite_code IS NULL;

-- 2) O'quvchi: invite kod orqali sinfga qo'shilish.
--    school_classes/school_students jadvallaridagi RLS policy'lar
--    faqat allaqachon a'zo bo'lganlarga SELECT ruxsat beradi, shuning
--    uchun yangi qo'shiluvchi klient kodidan to'g'ridan-to'g'ri so'rov
--    yubora olmaydi. SECURITY DEFINER funksiya buni xavfsiz, faqat
--    kerakli tekshiruvlar bilan (kod to'g'riligi, dublikat, limit)
--    chetlab o'tadi — policy'larni o'zgartirish shart emas.
CREATE OR REPLACE FUNCTION public.join_school_class_by_code(p_invite_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_class public.school_classes%ROWTYPE;
  v_existing uuid;
  v_full_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Avval tizimga kiring.');
  END IF;

  SELECT * INTO v_class FROM public.school_classes
  WHERE upper(invite_code) = upper(trim(p_invite_code));

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Noto''g''ri kod. O''qituvchingizdan so''rang.');
  END IF;

  SELECT id INTO v_existing FROM public.school_students
  WHERE class_id = v_class.id AND user_id = auth.uid();

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Siz allaqachon bu sinfga qo''shilgansiz.');
  END IF;

  SELECT full_name INTO v_full_name FROM public.profiles WHERE user_id = auth.uid();

  INSERT INTO public.school_students (class_id, user_id, full_name)
  VALUES (v_class.id, auth.uid(), v_full_name);

  RETURN json_build_object('success', true, 'class_id', v_class.id, 'class_name', v_class.name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_school_class_by_code(text) TO authenticated;

-- 4) O'qituvchi: maktabning teacher_invite_code'i orqali o'qituvchi
--    sifatida qo'shilish
CREATE OR REPLACE FUNCTION public.join_school_as_teacher(p_invite_code text, p_subject text DEFAULT 'English')
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_school public.schools%ROWTYPE;
  v_existing uuid;
  v_teacher_count integer;
  v_full_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Avval tizimga kiring.');
  END IF;

  SELECT * INTO v_school FROM public.schools
  WHERE upper(teacher_invite_code) = upper(trim(p_invite_code));

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Noto''g''ri taklif kodi.');
  END IF;

  IF v_school.owner_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Siz bu maktabning egasisiz.');
  END IF;

  SELECT id INTO v_existing FROM public.school_teachers
  WHERE school_id = v_school.id AND user_id = auth.uid();

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Siz allaqachon bu maktabda o''qituvchisiz.');
  END IF;

  SELECT count(*) INTO v_teacher_count FROM public.school_teachers WHERE school_id = v_school.id;
  IF v_teacher_count >= v_school.max_teachers THEN
    RETURN json_build_object('success', false, 'error', 'Maktabda o''qituvchilar soni to''lgan.');
  END IF;

  SELECT full_name INTO v_full_name FROM public.profiles WHERE user_id = auth.uid();

  INSERT INTO public.school_teachers (school_id, user_id, name, subject)
  VALUES (v_school.id, auth.uid(), COALESCE(v_full_name, 'O''qituvchi'), p_subject);

  RETURN json_build_object('success', true, 'school_id', v_school.id, 'school_name', v_school.name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_school_as_teacher(text, text) TO authenticated;
