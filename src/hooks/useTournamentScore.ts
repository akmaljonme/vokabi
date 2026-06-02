import { useCallback } from 'react';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';

export const useTournamentScore = () => {
  const { user } = useAuth();

  const addScore = useCallback(async (score: number) => {
    if (!user || score <= 0) return;

    // Find active tournaments the user is participating in
    const { data: tournaments } = await (supabase.from('tournaments') as any)
      .select('id').eq('status', 'active');

    if (!tournaments || tournaments.length === 0) return;

    for (const t of tournaments) {
      const { data: participant } = await (supabase.from('tournament_participants') as any)
        .select('*').eq('tournament_id', t.id).eq('user_id', user.id).maybeSingle();

      if (participant) {
        await (supabase.from('tournament_participants') as any)
          .update({
            total_score: participant.total_score + score,
            games_played: participant.games_played + 1,
          })
          .eq('id', participant.id);
      }
    }
  }, [user]);

  return { addScore };
};
