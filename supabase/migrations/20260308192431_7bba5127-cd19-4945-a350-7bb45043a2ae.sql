
-- Allow authenticated users to view all profiles (needed for community/DM user search)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
