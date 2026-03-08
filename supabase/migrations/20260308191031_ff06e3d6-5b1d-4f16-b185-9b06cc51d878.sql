
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;
CREATE INDEX idx_profiles_username ON public.profiles (username);
