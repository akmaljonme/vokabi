
-- Allow users to delete their own DMs
CREATE POLICY "Users can delete own DMs"
  ON public.direct_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Allow users to update their own DMs (for editing)
CREATE POLICY "Users can update own sent DMs"
  ON public.direct_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Allow users to update their own chat messages (for editing)
CREATE POLICY "Users can update own chat messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
