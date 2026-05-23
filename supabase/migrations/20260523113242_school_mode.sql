-- ============================================
-- SCHOOL MODE - Complete Database Schema
-- ============================================

-- 1. SCHOOLS (Maktab/Kurs)
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
  max_teachers integer NOT NULL DEFAULT 3,
  max_students integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School owners can manage their school" ON public.schools FOR ALL TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "School members can view their school" ON public.schools FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.school_members sm WHERE sm.school_id = schools.id AND sm.user_id = auth.uid())
);

-- 2. SCHOOL MEMBERS (O'qituvchi va o'quvchilar)
CREATE TABLE public.school_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('owner', 'teacher', 'student')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(school_id, user_id)
);
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their school members" ON public.school_members FOR SELECT TO authenticated USING (
  school_id IN (SELECT school_id FROM public.school_members WHERE user_id = auth.uid())
);
CREATE POLICY "Owners and teachers can manage members" ON public.school_members FOR ALL TO authenticated USING (
  school_id IN (SELECT school_id FROM public.school_members WHERE user_id = auth.uid() AND role IN ('owner', 'teacher'))
);
CREATE POLICY "Users can view own membership" ON public.school_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. CLASSROOMS (Sinflar)
CREATE TABLE public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  level text NOT NULL DEFAULT 'A1' CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  invite_code text UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  max_students integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their classrooms" ON public.classrooms FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "School members can view classrooms" ON public.classrooms FOR SELECT TO authenticated USING (
  school_id IN (SELECT school_id FROM public.school_members WHERE user_id = auth.uid())
);

-- 4. CLASSROOM STUDENTS (Sinf o'quvchilari)
CREATE TABLE public.classroom_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(classroom_id, student_id)
);
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage classroom students" ON public.classroom_students FOR ALL TO authenticated USING (
  classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = auth.uid())
);
CREATE POLICY "Students can view own enrollment" ON public.classroom_students FOR SELECT TO authenticated USING (student_id = auth.uid());

-- 5. ASSIGNMENTS (Vazifalar)
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'test' CHECK (type IN ('test', 'essay', 'speaking', 'vocabulary')),
  test_id uuid REFERENCES public.tests(id),
  due_date timestamptz,
  max_attempts integer NOT NULL DEFAULT 1,
  passing_score integer NOT NULL DEFAULT 60,
  xp_reward integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage assignments" ON public.assignments FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Students can view active assignments" ON public.assignments FOR SELECT TO authenticated USING (
  is_active = true AND
  classroom_id IN (SELECT classroom_id FROM public.classroom_students WHERE student_id = auth.uid())
);

-- 6. ASSIGNMENT SUBMISSIONS (Topshirilgan vazifalar)
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer,
  percentage integer,
  passed boolean,
  answers jsonb,
  feedback text,
  ai_feedback jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  graded_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can insert own submissions" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers can view class submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (
  assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid())
);
CREATE POLICY "Teachers can grade submissions" ON public.assignment_submissions FOR UPDATE TO authenticated USING (
  assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid())
);

-- 7. STUDENT STREAKS (Kunlik streak)
CREATE TABLE public.student_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  total_days_active integer NOT NULL DEFAULT 0,
  streak_freeze_count integer NOT NULL DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streak" ON public.student_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own streak" ON public.student_streaks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can view student streaks" ON public.student_streaks FOR SELECT TO authenticated USING (
  user_id IN (
    SELECT cs.student_id FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

-- 8. WEEKLY GOALS (Haftalik maqsadlar)
CREATE TABLE public.weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE SET NULL,
  week_start date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  target_xp integer NOT NULL DEFAULT 500,
  target_tests integer NOT NULL DEFAULT 5,
  target_streak_days integer NOT NULL DEFAULT 5,
  earned_xp integer NOT NULL DEFAULT 0,
  completed_tests integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals" ON public.weekly_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can view student goals" ON public.weekly_goals FOR SELECT TO authenticated USING (
  user_id IN (
    SELECT cs.student_id FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

-- 9. NOTIFICATIONS (Bildirishnomalar)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('assignment', 'streak', 'achievement', 'grade', 'announcement', 'payment')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 10. ANNOUNCEMENTS (E'lonlar)
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage announcements" ON public.announcements FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Students can view announcements" ON public.announcements FOR SELECT TO authenticated USING (
  classroom_id IN (SELECT classroom_id FROM public.classroom_students WHERE student_id = auth.uid())
);

-- 11. SCHOOL PAYMENTS (To'lovlar)
CREATE TABLE public.school_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'UZS',
  period text NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date date NOT NULL,
  paid_at timestamptz,
  receipt_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own payments" ON public.school_payments FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "School owners can manage payments" ON public.school_payments FOR ALL TO authenticated USING (
  school_id IN (SELECT id FROM public.schools WHERE owner_id = auth.uid())
);

-- 12. TRIGGERS
CREATE OR REPLACE FUNCTION public.update_school_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_school_updated_at();
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.update_school_updated_at();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_school_updated_at();

-- 13. HELPER FUNCTIONS

-- Sinf statistikasini olish
CREATE OR REPLACE FUNCTION public.get_classroom_stats(p_classroom_id uuid)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT json_build_object(
    'total_students', (SELECT count(*) FROM classroom_students WHERE classroom_id = p_classroom_id AND is_active = true),
    'total_assignments', (SELECT count(*) FROM assignments WHERE classroom_id = p_classroom_id AND is_active = true),
    'avg_score', COALESCE((
      SELECT round(avg(s.percentage))
      FROM assignment_submissions s
      JOIN assignments a ON a.id = s.assignment_id
      WHERE a.classroom_id = p_classroom_id
    ), 0),
    'completion_rate', COALESCE((
      SELECT round(
        count(DISTINCT s.student_id)::numeric /
        NULLIF((SELECT count(*) FROM classroom_students WHERE classroom_id = p_classroom_id AND is_active = true), 0) * 100
      )
      FROM assignment_submissions s
      JOIN assignments a ON a.id = s.assignment_id
      WHERE a.classroom_id = p_classroom_id
    ), 0)
  )
$$;

-- O'quvchi streak ni yangilash
CREATE OR REPLACE FUNCTION public.update_student_streak(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_last_date date;
  v_current_streak integer;
  v_longest_streak integer;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM student_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO student_streaks (user_id, current_streak, longest_streak, last_activity_date, total_days_active)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, 1);
    RETURN;
  END IF;

  IF v_last_date = CURRENT_DATE THEN RETURN; END IF;

  IF v_last_date = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    v_current_streak := 1;
  END IF;

  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE student_streaks SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = CURRENT_DATE,
    total_days_active = total_days_active + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Invite code orqali sinfga qo'shilish
CREATE OR REPLACE FUNCTION public.join_classroom_by_code(p_invite_code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_classroom classrooms%ROWTYPE;
  v_student_count integer;
BEGIN
  SELECT * INTO v_classroom FROM classrooms WHERE invite_code = upper(p_invite_code) AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Noto''g''ri kod');
  END IF;

  SELECT count(*) INTO v_student_count FROM classroom_students WHERE classroom_id = v_classroom.id AND is_active = true;
  IF v_student_count >= v_classroom.max_students THEN
    RETURN json_build_object('success', false, 'error', 'Sinf to''lgan');
  END IF;

  INSERT INTO classroom_students (classroom_id, student_id)
  VALUES (v_classroom.id, auth.uid())
  ON CONFLICT (classroom_id, student_id) DO UPDATE SET is_active = true;

  RETURN json_build_object('success', true, 'classroom_name', v_classroom.name, 'classroom_id', v_classroom.id);
END;
$$;

-- Indexes
CREATE INDEX idx_school_members_user ON public.school_members(user_id);
CREATE INDEX idx_school_members_school ON public.school_members(school_id);
CREATE INDEX idx_classroom_students_student ON public.classroom_students(student_id);
CREATE INDEX idx_classroom_students_classroom ON public.classroom_students(classroom_id);
CREATE INDEX idx_assignments_classroom ON public.assignments(classroom_id);
CREATE INDEX idx_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
