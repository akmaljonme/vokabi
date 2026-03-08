
-- Table for WebRTC signaling
CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  signal_type text NOT NULL, -- 'offer', 'answer', 'ice-candidate', 'call-invite', 'call-accept', 'call-reject', 'call-end'
  signal_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Both caller and callee can view signals
CREATE POLICY "Users can view own call signals"
  ON public.call_signals FOR SELECT
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can insert signals they send
CREATE POLICY "Users can insert call signals"
  ON public.call_signals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caller_id);

-- Users can delete their own signals
CREATE POLICY "Users can delete own signals"
  ON public.call_signals FOR DELETE
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;

-- Auto-cleanup old signals (older than 5 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_old_signals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.call_signals WHERE created_at < now() - interval '5 minutes';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_signals_trigger
  AFTER INSERT ON public.call_signals
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_signals();
