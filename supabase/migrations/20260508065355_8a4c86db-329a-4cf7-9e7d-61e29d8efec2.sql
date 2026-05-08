
-- 1. Restrict chat-media INSERT to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload chat media to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Explicit UPDATE policy for chat-media (owner only)
DROP POLICY IF EXISTS "Users can update own chat media" ON storage.objects;
CREATE POLICY "Users can update own chat media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. audio_files: require auth (no anonymous access to transcripts)
DROP POLICY IF EXISTS "Users can view audio for active tests" ON public.audio_files;
CREATE POLICY "Authenticated users can view audio for active tests"
ON public.audio_files FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tests
    WHERE tests.id = audio_files.test_id AND tests.is_active = true
  )
);
