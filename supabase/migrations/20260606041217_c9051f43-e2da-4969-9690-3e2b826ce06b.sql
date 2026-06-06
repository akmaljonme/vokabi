
CREATE TABLE public.telegram_phone_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  chat_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_phone_links TO service_role;
ALTER TABLE public.telegram_phone_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client access" ON public.telegram_phone_links FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.phone_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_phone_otp_codes_phone ON public.phone_otp_codes(phone, created_at DESC);
GRANT ALL ON public.phone_otp_codes TO service_role;
ALTER TABLE public.phone_otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client access otp" ON public.phone_otp_codes FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER trg_telegram_phone_links_updated
BEFORE UPDATE ON public.telegram_phone_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
