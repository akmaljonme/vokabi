-- Admin-only function to send a notification to every user in one call.
-- Used for release announcements — see /RELEASE_NOTIFICATIONS.md for the
-- standard process to follow after every meaningful update.

CREATE OR REPLACE FUNCTION public.broadcast_notification(p_title text, p_body text, p_type text DEFAULT 'announcement')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Faqat administrator barcha foydalanuvchilarga xabar yubora oladi';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body)
  SELECT user_id, p_type, p_title, p_body FROM public.profiles;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.broadcast_notification(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text, text) TO authenticated;
