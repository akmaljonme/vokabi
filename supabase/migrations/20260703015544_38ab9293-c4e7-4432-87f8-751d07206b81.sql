
-- Mock test series (yil bo'yicha)
CREATE TABLE public.mock_test_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year integer NOT NULL,
  exam_type text NOT NULL DEFAULT 'ielts',
  color text DEFAULT '#DC2626',
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mock_test_series TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mock_test_series TO authenticated;
GRANT ALL ON public.mock_test_series TO service_role;

ALTER TABLE public.mock_test_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active series" ON public.mock_test_series
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert series" ON public.mock_test_series
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update series" ON public.mock_test_series
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete series" ON public.mock_test_series
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mock_test_series_updated_at
  BEFORE UPDATE ON public.mock_test_series
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Mock tests (har series ichida 4 test)
CREATE TABLE public.mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.mock_test_series(id) ON DELETE CASCADE,
  test_number integer NOT NULL,
  title text,
  listening_test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  reading_test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  writing_test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  speaking_test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, test_number)
);

GRANT SELECT ON public.mock_tests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mock_tests TO authenticated;
GRANT ALL ON public.mock_tests TO service_role;

ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mock tests" ON public.mock_tests
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert mock tests" ON public.mock_tests
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update mock tests" ON public.mock_tests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete mock tests" ON public.mock_tests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mock_tests_updated_at
  BEFORE UPDATE ON public.mock_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mock_tests_series ON public.mock_tests(series_id);
