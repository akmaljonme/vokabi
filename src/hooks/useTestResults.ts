import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TestResult } from '@/types/cefr';

export const useTestResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    if (!user) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveResult = async (result: TestResult) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase.from('test_results').insert({
        user_id: user.id,
        level: result.level,
        skill: result.skill,
        mock_id: result.mockId,
        total_questions: result.totalQuestions,
        correct_answers: result.correctAnswers,
        percentage: result.percentage,
        passed: result.passed,
        time_taken: result.timeTaken,
        answers: result.answers,
      });

      if (error) throw error;
      
      // Refresh results
      await fetchResults();
      
      return { error: null };
    } catch (error: any) {
      console.error('Error saving test result:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchResults();
  }, [user]);

  return { results, loading, saveResult, refetch: fetchResults };
};
