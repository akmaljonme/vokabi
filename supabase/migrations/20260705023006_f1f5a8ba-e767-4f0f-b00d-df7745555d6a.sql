
CREATE TABLE public.voice_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, used_date)
);

GRANT SELECT ON public.voice_usage TO authenticated;
GRANT ALL ON public.voice_usage TO service_role;

ALTER TABLE public.voice_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice usage"
  ON public.voice_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_voice_usage(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  INSERT INTO public.voice_usage (user_id, used_date, count)
  VALUES (_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, used_date)
  DO UPDATE SET count = public.voice_usage.count + 1, updated_at = now()
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_voice_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_voice_usage(uuid) TO service_role;

CREATE TRIGGER trg_voice_usage_updated
  BEFORE UPDATE ON public.voice_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
