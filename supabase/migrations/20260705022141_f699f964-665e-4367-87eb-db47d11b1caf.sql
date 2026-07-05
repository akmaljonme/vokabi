
-- =========================================================
-- 1. Restrict public reads on paid/answer-key tables
-- =========================================================
DROP POLICY IF EXISTS "Users can view questions for active tests" ON public.questions;
CREATE POLICY "Users can view questions for active tests"
  ON public.questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tests WHERE tests.id = questions.test_id AND tests.is_active = true));

DROP POLICY IF EXISTS "Users can view passages for active tests" ON public.reading_passages;
CREATE POLICY "Users can view passages for active tests"
  ON public.reading_passages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tests WHERE tests.id = reading_passages.test_id AND tests.is_active = true));

DROP POLICY IF EXISTS "Anyone can read shared tests" ON public.shared_tests;
CREATE POLICY "Authenticated users can read shared tests"
  ON public.shared_tests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can read results" ON public.shared_test_results;
CREATE POLICY "Admins can read shared results"
  ON public.shared_test_results FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can insert results" ON public.shared_test_results;
CREATE POLICY "Authenticated users can insert shared results"
  ON public.shared_test_results FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shared_tests st WHERE st.id = shared_test_results.shared_test_id));

REVOKE SELECT ON public.shared_tests FROM anon;
REVOKE SELECT ON public.shared_test_results FROM anon;
REVOKE INSERT ON public.shared_test_results FROM anon;
REVOKE SELECT ON public.questions FROM anon;
REVOKE SELECT ON public.reading_passages FROM anon;

-- =========================================================
-- 2. Server-side exam access code verification
-- =========================================================
CREATE OR REPLACE FUNCTION public.verify_exam_access(_exam_id uuid, _code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_code text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT access_code INTO v_code FROM public.exams WHERE id = _exam_id AND is_active = true;
  IF v_code IS NULL THEN RETURN true; END IF; -- no code means open access
  RETURN upper(trim(_code)) = upper(trim(v_code));
END;
$$;
REVOKE ALL ON FUNCTION public.verify_exam_access(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_exam_access(uuid, text) TO authenticated;

-- Hide access_code from clients: replace exams SELECT policy so users can read
-- non-sensitive columns via a view; admins still see all through their policy.
-- Create a view without access_code and grant read to authenticated.
CREATE OR REPLACE VIEW public.exams_public
WITH (security_invoker = true) AS
SELECT id, title, description, skill, level, time_limit, max_attempts,
       is_active, created_at, created_by
FROM public.exams;
GRANT SELECT ON public.exams_public TO authenticated;

-- Restrict base exams SELECT to admins only; regular users must go through the view or RPC.
DROP POLICY IF EXISTS "Anyone can view active exams" ON public.exams;
CREATE POLICY "Admins can view exams"
  ON public.exams FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 3. Integrity trigger: test_results
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_test_result()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.total_questions IS NULL OR NEW.total_questions <= 0 THEN
    RAISE EXCEPTION 'invalid total_questions';
  END IF;
  IF NEW.correct_answers IS NULL OR NEW.correct_answers < 0 OR NEW.correct_answers > NEW.total_questions THEN
    RAISE EXCEPTION 'invalid correct_answers';
  END IF;
  IF NEW.percentage IS NULL OR NEW.percentage < 0 OR NEW.percentage > 100 THEN
    RAISE EXCEPTION 'invalid percentage';
  END IF;
  IF abs(NEW.percentage - round((NEW.correct_answers::numeric * 100 / NEW.total_questions)::numeric, 2)) > 2 THEN
    RAISE EXCEPTION 'percentage does not match score';
  END IF;
  NEW.passed := NEW.percentage >= 60;
  IF NEW.user_id <> auth.uid() AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'user_id mismatch';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_test_result ON public.test_results;
CREATE TRIGGER trg_validate_test_result
  BEFORE INSERT OR UPDATE ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.validate_test_result();

-- =========================================================
-- 4. Integrity trigger: exam_attempts
-- Prevent users from PATCHing score/percentage/passed on their own attempts;
-- only the service role (edge functions / admin) can change scoring fields.
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_exam_attempt_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Allow service_role/admin full control
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Regular users must not tamper with scoring fields after creation
  IF NEW.score IS DISTINCT FROM OLD.score
     OR NEW.percentage IS DISTINCT FROM OLD.percentage
     OR NEW.passed IS DISTINCT FROM OLD.passed
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.exam_id IS DISTINCT FROM OLD.exam_id THEN
    -- Only allow the initial write (when previous value was null/0)
    IF NOT (
      (OLD.score IS NULL OR OLD.score = 0)
      AND (OLD.percentage IS NULL OR OLD.percentage = 0)
      AND (OLD.passed IS NULL OR OLD.passed = false)
    ) THEN
      RAISE EXCEPTION 'exam scoring fields are immutable';
    END IF;
  END IF;
  -- Validate sanity of any new values
  IF NEW.percentage IS NOT NULL AND (NEW.percentage < 0 OR NEW.percentage > 100) THEN
    RAISE EXCEPTION 'invalid percentage';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_exam_attempt_update ON public.exam_attempts;
CREATE TRIGGER trg_validate_exam_attempt_update
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.validate_exam_attempt_update();

CREATE OR REPLACE FUNCTION public.validate_exam_attempt_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_max int; v_used int;
BEGIN
  IF NEW.user_id <> auth.uid() AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'user_id mismatch';
  END IF;
  SELECT max_attempts INTO v_max FROM public.exams WHERE id = NEW.exam_id;
  SELECT count(*) INTO v_used FROM public.exam_attempts WHERE exam_id = NEW.exam_id AND user_id = NEW.user_id;
  IF v_max IS NOT NULL AND v_used >= v_max THEN
    RAISE EXCEPTION 'max attempts exceeded';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_exam_attempt_insert ON public.exam_attempts;
CREATE TRIGGER trg_validate_exam_attempt_insert
  BEFORE INSERT ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.validate_exam_attempt_insert();

-- =========================================================
-- 5. Integrity trigger: user_progress (xp, level, streak caps)
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_user_progress_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'user_id immutable';
  END IF;
  -- XP: monotonic, max +500 per update
  IF NEW.xp < OLD.xp THEN NEW.xp := OLD.xp; END IF;
  IF NEW.xp - OLD.xp > 500 THEN NEW.xp := OLD.xp + 500; END IF;
  -- Level: derived from xp, monotonic, capped
  IF NEW.level < OLD.level THEN NEW.level := OLD.level; END IF;
  IF NEW.level > GREATEST(1, NEW.xp / 500 + 1) THEN
    NEW.level := GREATEST(1, NEW.xp / 500 + 1);
  END IF;
  -- Streaks: allow only +1, 0, or 1 (reset)
  IF NEW.current_streak <> OLD.current_streak
     AND NEW.current_streak NOT IN (OLD.current_streak + 1, 0, 1) THEN
    NEW.current_streak := OLD.current_streak;
  END IF;
  IF NEW.longest_streak < OLD.longest_streak THEN
    NEW.longest_streak := OLD.longest_streak;
  END IF;
  IF NEW.longest_streak > GREATEST(OLD.longest_streak, NEW.current_streak) THEN
    NEW.longest_streak := GREATEST(OLD.longest_streak, NEW.current_streak);
  END IF;
  -- tests_completed: only +0 or +1
  IF NEW.tests_completed NOT IN (OLD.tests_completed, OLD.tests_completed + 1) THEN
    NEW.tests_completed := OLD.tests_completed;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_user_progress_update ON public.user_progress;
CREATE TRIGGER trg_validate_user_progress_update
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_progress_update();

CREATE OR REPLACE FUNCTION public.validate_user_progress_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'user_id mismatch';
  END IF;
  -- Prevent fabricated starting values
  NEW.xp := LEAST(COALESCE(NEW.xp, 0), 100);
  NEW.level := LEAST(COALESCE(NEW.level, 1), 1);
  NEW.current_streak := LEAST(COALESCE(NEW.current_streak, 0), 1);
  NEW.longest_streak := LEAST(COALESCE(NEW.longest_streak, 0), 1);
  NEW.tests_completed := LEAST(COALESCE(NEW.tests_completed, 0), 0);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_user_progress_insert ON public.user_progress;
CREATE TRIGGER trg_validate_user_progress_insert
  BEFORE INSERT ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_progress_insert();

-- =========================================================
-- 6. tournament_participants: cap per-update score changes
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_tournament_participant_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> OLD.user_id OR NEW.tournament_id <> OLD.tournament_id THEN
    RAISE EXCEPTION 'immutable identifier';
  END IF;
  IF NEW.total_score < OLD.total_score THEN NEW.total_score := OLD.total_score; END IF;
  IF NEW.total_score - OLD.total_score > 500 THEN NEW.total_score := OLD.total_score + 500; END IF;
  IF NEW.games_played NOT IN (OLD.games_played, OLD.games_played + 1) THEN
    NEW.games_played := OLD.games_played;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_tournament_participant_update ON public.tournament_participants;
CREATE TRIGGER trg_validate_tournament_participant_update
  BEFORE UPDATE ON public.tournament_participants
  FOR EACH ROW EXECUTE FUNCTION public.validate_tournament_participant_update();

-- =========================================================
-- 7. game_rooms: restrict who can change what
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_game_room_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Identifiers immutable
  IF NEW.player1_id IS DISTINCT FROM OLD.player1_id THEN
    NEW.player1_id := OLD.player1_id;
  END IF;
  -- Status transitions
  IF OLD.status = 'finished' AND NEW.status <> 'finished' THEN
    RAISE EXCEPTION 'cannot revive finished game';
  END IF;
  -- Score fields can only increase by small deltas
  IF NEW.player1_score IS NOT NULL AND OLD.player1_score IS NOT NULL
     AND NEW.player1_score - OLD.player1_score > 50 THEN
    NEW.player1_score := OLD.player1_score + 50;
  END IF;
  IF NEW.player2_score IS NOT NULL AND OLD.player2_score IS NOT NULL
     AND NEW.player2_score - OLD.player2_score > 50 THEN
    NEW.player2_score := OLD.player2_score + 50;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_game_room_update ON public.game_rooms;
CREATE TRIGGER trg_validate_game_room_update
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW EXECUTE FUNCTION public.validate_game_room_update();

-- =========================================================
-- 8. user_achievements: server-side threshold verification
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_user_achievement_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_cat text; v_threshold int; v_actual int;
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'user_id mismatch';
  END IF;
  SELECT category, threshold INTO v_cat, v_threshold
  FROM public.achievements WHERE id = NEW.achievement_id;
  IF v_cat IS NULL THEN
    RAISE EXCEPTION 'unknown achievement';
  END IF;
  -- Prevent duplicates
  IF EXISTS (SELECT 1 FROM public.user_achievements
             WHERE user_id = NEW.user_id AND achievement_id = NEW.achievement_id) THEN
    RAISE EXCEPTION 'achievement already awarded';
  END IF;
  -- Verify threshold based on category (best effort; unknown categories allowed)
  IF v_cat IN ('tests', 'tests_completed', 'test') THEN
    SELECT count(*) INTO v_actual FROM public.test_results WHERE user_id = NEW.user_id;
    IF v_actual < v_threshold THEN RAISE EXCEPTION 'threshold not met'; END IF;
  ELSIF v_cat IN ('xp', 'points') THEN
    SELECT COALESCE(xp, 0) INTO v_actual FROM public.user_progress WHERE user_id = NEW.user_id;
    IF v_actual < v_threshold THEN RAISE EXCEPTION 'threshold not met'; END IF;
  ELSIF v_cat IN ('streak', 'streaks') THEN
    SELECT COALESCE(longest_streak, 0) INTO v_actual FROM public.user_progress WHERE user_id = NEW.user_id;
    IF v_actual < v_threshold THEN RAISE EXCEPTION 'threshold not met'; END IF;
  ELSIF v_cat IN ('passed', 'passed_tests') THEN
    SELECT count(*) INTO v_actual FROM public.test_results WHERE user_id = NEW.user_id AND passed = true;
    IF v_actual < v_threshold THEN RAISE EXCEPTION 'threshold not met'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_user_achievement_insert ON public.user_achievements;
CREATE TRIGGER trg_validate_user_achievement_insert
  BEFORE INSERT ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_achievement_insert();

-- =========================================================
-- 9. Fix function search_path (SUPA_function_search_path_mutable)
-- =========================================================
CREATE OR REPLACE FUNCTION public.increment_test_views(test_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_tests SET view_count = view_count + 1 WHERE id = test_uuid;
$$;

-- =========================================================
-- 10. Lock down SECURITY DEFINER function EXECUTE privileges
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.cleanup_old_signals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_ad_stat(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_ad_stat(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_test_views(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_test_views(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.join_school_as_teacher(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_school_as_teacher(text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.join_school_class_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_school_class_by_code(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- =========================================================
-- 11. Storage: prevent listing chat-media across users
-- Users can only read their own chat-media folder.
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
CREATE POLICY "Users can view own chat media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = (auth.uid())::text);
