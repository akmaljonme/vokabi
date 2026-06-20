-- Shared tests table
CREATE TABLE IF NOT EXISTS shared_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  level TEXT NOT NULL,
  skill TEXT NOT NULL,
  mock_id INTEGER,
  title TEXT,
  questions JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Public access
ALTER TABLE shared_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shared tests" ON shared_tests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create" ON shared_tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_test_views(test_uuid UUID)
RETURNS void AS $$
  UPDATE shared_tests SET view_count = view_count + 1 WHERE id = test_uuid;
$$ LANGUAGE sql;

-- Shared test results table
CREATE TABLE IF NOT EXISTS shared_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_test_id UUID REFERENCES shared_tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  cheated BOOLEAN DEFAULT FALSE,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert results" ON shared_test_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read results" ON shared_test_results FOR SELECT USING (true);
