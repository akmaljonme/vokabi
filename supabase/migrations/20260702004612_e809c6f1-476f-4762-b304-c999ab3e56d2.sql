
DROP POLICY IF EXISTS "Authenticated read ad images" ON storage.objects;
CREATE POLICY "Authenticated read ad images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'ad-images');

DROP POLICY IF EXISTS "Admins upload ad images" ON storage.objects;
CREATE POLICY "Admins upload ad images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update ad images" ON storage.objects;
CREATE POLICY "Admins update ad images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete ad images" ON storage.objects;
CREATE POLICY "Admins delete ad images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));
