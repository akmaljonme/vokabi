import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAIGameQuestions = <T>(gameType: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (level: string): Promise<T[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-game-questions', {
        body: { gameType, level },
      });
      if (fnError) throw fnError;
      if (data?.questions && Array.isArray(data.questions)) {
        return data.questions as T[];
      }
      throw new Error('Invalid response');
    } catch (e: any) {
      console.error('[AI Game]', e);
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [gameType]);

  return { generate, loading, error };
};
