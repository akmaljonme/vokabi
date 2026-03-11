import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, CheckCircle, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Quest {
  id: string;
  quest_type: string;
  title: string;
  description: string;
  target_value: number;
  xp_reward: number;
  game_type: string | null;
  current_value: number;
  completed: boolean;
  progress_id?: string;
}

interface Props { compact?: boolean; }

const DEFAULT_QUESTS = [
  { quest_type: 'play_games', title: "3 ta o'yin o'ynang", description: "Istalgan 3 ta o'yinni o'ynab tugatish", target_value: 3, xp_reward: 30, game_type: null },
  { quest_type: 'score_points', title: "100 ball to'plang", description: "Istalgan o'yinlarda jami 100 ball to'plash", target_value: 100, xp_reward: 50, game_type: null },
  { quest_type: 'play_specific', title: "Grammar Battle o'ynang", description: "Grammar Battle o'yinini 1 marta o'ynash", target_value: 1, xp_reward: 20, game_type: 'grammar_battle' },
  { quest_type: 'play_specific', title: "Spelling Bee o'ynang", description: "Spelling Bee o'yinini 1 marta o'ynash", target_value: 1, xp_reward: 20, game_type: 'spelling_bee' },
];

export const DailyGameQuests = ({ compact = false }: Props) => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadQuests();
  }, [user]);

  const loadQuests = async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // Get today's quests
    let { data: dailyQuests } = await (supabase.from('daily_game_quests') as any)
      .select('*').eq('quest_date', today);

    // If no quests for today, create them
    if (!dailyQuests || dailyQuests.length === 0) {
      const newQuests = DEFAULT_QUESTS.map(q => ({ ...q, quest_date: today }));
      const { data: inserted } = await (supabase.from('daily_game_quests') as any)
        .insert(newQuests).select();
      dailyQuests = inserted || [];
    }

    // Get user progress for these quests
    if (dailyQuests && dailyQuests.length > 0) {
      const questIds = dailyQuests.map((q: any) => q.id);
      const { data: progress } = await (supabase.from('user_quest_progress') as any)
        .select('*').eq('user_id', user.id).in('quest_id', questIds);

      // Calculate actual progress from game_scores
      const todayStart = new Date(today).toISOString();
      const { data: todayScores } = await supabase.from('game_scores')
        .select('*').eq('user_id', user.id).gte('created_at', todayStart);

      const enriched: Quest[] = dailyQuests.map((q: any) => {
        const p = progress?.find((pr: any) => pr.quest_id === q.id);
        let currentValue = p?.current_value || 0;

        // Auto-calculate progress from today's scores
        if (todayScores) {
          if (q.quest_type === 'play_games') {
            currentValue = todayScores.length;
          } else if (q.quest_type === 'score_points') {
            currentValue = todayScores.reduce((a: number, b: any) => a + b.score, 0);
          } else if (q.quest_type === 'play_specific' && q.game_type) {
            currentValue = todayScores.filter((s: any) => s.game_type === q.game_type).length;
          }
        }

        return {
          ...q,
          current_value: currentValue,
          completed: p?.completed || currentValue >= q.target_value,
          progress_id: p?.id,
        };
      });

      setQuests(enriched);

      // Auto-update progress in DB
      for (const q of enriched) {
        if (q.current_value > 0) {
          if (q.progress_id) {
            await (supabase.from('user_quest_progress') as any)
              .update({ current_value: q.current_value, completed: q.current_value >= q.target_value, ...(q.current_value >= q.target_value && !q.completed ? { completed_at: new Date().toISOString() } : {}) })
              .eq('id', q.progress_id);
          } else {
            await (supabase.from('user_quest_progress') as any)
              .insert({ user_id: user.id, quest_id: q.id, current_value: q.current_value, completed: q.current_value >= q.target_value, ...(q.current_value >= q.target_value ? { completed_at: new Date().toISOString() } : {}) });
          }
        }
      }
    }

    setLoading(false);
  };

  const claimReward = async (quest: Quest) => {
    if (!user || !quest.completed) return;
    // Add XP
    const { data: progress } = await (supabase.from('user_progress') as any)
      .select('*').eq('user_id', user.id).maybeSingle();
    if (progress) {
      await (supabase.from('user_progress') as any)
        .update({ xp: progress.xp + quest.xp_reward }).eq('user_id', user.id);
    }
    toast({ title: `🎁 +${quest.xp_reward} XP olindi!` });
  };

  const completedCount = quests.filter(q => q.completed).length;
  const totalXP = quests.filter(q => q.completed).reduce((a, b) => a + b.xp_reward, 0);

  if (loading) {
    return compact ? null : (
      <div className="text-center py-8"><Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" /></div>
    );
  }

  if (compact) {
    return (
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Kunlik vazifalar
          </h3>
          <span className="text-xs text-muted-foreground">{completedCount}/{quests.length}</span>
        </div>
        <Progress value={(completedCount / Math.max(quests.length, 1)) * 100} className="h-1.5 mb-3" />
        <div className="space-y-1.5">
          {quests.slice(0, 3).map(q => (
            <div key={q.id} className={`flex items-center gap-2 text-xs ${q.completed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              {q.completed ? <CheckCircle className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
              <span className={q.completed ? 'line-through' : ''}>{q.title}</span>
              <span className="ml-auto font-medium">+{q.xp_reward}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="card-elevated p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-amber-500/5" />
        <div className="relative flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Kunlik Vazifalar
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount === quests.length ? "🎉 Barcha vazifalar bajarildi!" : `${completedCount}/${quests.length} bajarildi`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalXP}</p>
            <p className="text-xs text-muted-foreground">XP yig'ildi</p>
          </div>
        </div>
        <Progress value={(completedCount / Math.max(quests.length, 1)) * 100} className="h-2 mt-3" />
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        {quests.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`card-elevated p-4 ${q.completed ? 'border-emerald-500/30' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                q.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
              }`}>
                {q.completed ? <CheckCircle className="w-5 h-5" /> : <Target className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-bold text-sm ${q.completed ? 'line-through text-muted-foreground' : ''}`}>{q.title}</h4>
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                    <Zap className="w-3 h-3" /> {q.xp_reward} XP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{q.description}</p>
                <div className="flex items-center gap-2">
                  <Progress value={Math.min((q.current_value / q.target_value) * 100, 100)} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium">{Math.min(q.current_value, q.target_value)}/{q.target_value}</span>
                </div>
              </div>
            </div>
            {q.completed && (
              <div className="mt-2 text-right">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => claimReward(q)}>
                  <Gift className="w-3 h-3 mr-1" /> Mukofotni olish
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
