
-- Allow admins to manage chat rooms (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage chat rooms" ON public.chat_rooms FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
