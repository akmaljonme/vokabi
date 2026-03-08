
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'user_count', (SELECT count(*) FROM public.profiles),
    'test_count', (SELECT count(*) FROM public.tests WHERE is_active = true),
    'total_results', (SELECT count(*) FROM public.test_results),
    'passed_results', (SELECT count(*) FROM public.test_results WHERE passed = true)
  )
$$;
