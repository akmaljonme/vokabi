-- Admin barcha foydalanuvchilarning ma'lumotlarini ko'ra olishi uchun.
-- ESLATMA: tekshiruv natijasida productiondagi ko'pchilik jadvallarda
-- (profiles, user_progress, exam_attempts, subscriptions, payment_requests,
-- user_achievements, user_roles, test_results) admin uchun SELECT siyosati
-- allaqachon mavjud ekan. Faqat voice_usage jadvalida yetishmagan edi.

CREATE POLICY "Admins can view all voice usage"
ON public.voice_usage FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
