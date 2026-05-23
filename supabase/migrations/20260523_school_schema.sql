-- ═══════════════════════════════════════════════
-- SCHOOL MODE SCHEMA
-- ═══════════════════════════════════════════════

-- Schools / Kurslar
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','basic','pro')),
  max_teachers INT DEFAULT 3,
  max_students INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- O'qituvchilar
CREATE TABLE IF NOT EXISTS school_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT DEFAULT 'English',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, user_id)
);

-- Sinflar / Guruhlar
CREATE TABLE IF NOT EXISTS school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES school_teachers(id),
  name TEXT NOT NULL,
  level TEXT DEFAULT 'B1',
  invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- O'quvchilar
CREATE TABLE IF NOT EXISTS school_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  streak INT DEFAULT 0,
  xp INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- Vazifalar
CREATE TABLE IF NOT EXISTS school_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES school_teachers(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'test' CHECK (type IN ('test','essay','game','vocabulary')),
  due_date TIMESTAMPTZ,
  max_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vazifa natijalari
CREATE TABLE IF NOT EXISTS school_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES school_assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES school_students(id) ON DELETE CASCADE,
  score INT,
  content TEXT,
  ai_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- To'lovlar
CREATE TABLE IF NOT EXISTS school_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  currency TEXT DEFAULT 'UZS',
  provider TEXT CHECK (provider IN ('payme','click','cash')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "schools_owner" ON schools FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "teachers_school" ON school_teachers FOR ALL USING (
  school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  OR user_id = auth.uid()
);
CREATE POLICY "classes_access" ON school_classes FOR ALL USING (
  school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
  OR teacher_id IN (SELECT id FROM school_teachers WHERE user_id = auth.uid())
  OR id IN (SELECT class_id FROM school_students WHERE user_id = auth.uid())
);
CREATE POLICY "students_access" ON school_students FOR ALL USING (
  user_id = auth.uid()
  OR class_id IN (
    SELECT id FROM school_classes WHERE teacher_id IN (
      SELECT id FROM school_teachers WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "assignments_access" ON school_assignments FOR ALL USING (
  class_id IN (
    SELECT id FROM school_classes WHERE 
      teacher_id IN (SELECT id FROM school_teachers WHERE user_id = auth.uid())
      OR id IN (SELECT class_id FROM school_students WHERE user_id = auth.uid())
  )
);
CREATE POLICY "submissions_access" ON school_submissions FOR ALL USING (
  student_id IN (SELECT id FROM school_students WHERE user_id = auth.uid())
  OR assignment_id IN (
    SELECT id FROM school_assignments WHERE teacher_id IN (
      SELECT id FROM school_teachers WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "payments_owner" ON school_payments FOR ALL USING (
  school_id IN (SELECT id FROM schools WHERE owner_id = auth.uid())
);
