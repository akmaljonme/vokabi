import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Trophy, Target, Clock, Gamepad2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useAuth } from '@/contexts/AuthContext';

interface GameStat {
  game_type: string;
  total_games: number;
  total_score: number;
  avg_score: number;
  best_score: number;
  last_played: string;
}

const GAME_INFO: Record<string, { icon: string; name: string; color: string }> = {
  word_match: { icon: '🔗', name: 'Word Match', color: 'from-blue-500 to-cyan-500' },
  spelling_bee: { icon: '🐝', name: 'Spelling Bee', color: 'from-amber-500 to-orange-500' },
  grammar_battle: { icon: '⚔️', name: 'Grammar Battle', color: 'from-purple-500 to-pink-500' },
  flashcards: { icon: '🃏', name: 'Flashcards', color: 'from-emerald-500 to-teal-500' },
  hangman: { icon: '💀', name: 'Hangman', color: 'from-red-500 to-rose-500' },
  sentence_builder: { icon: '📝', name: 'Sentence Builder', color: 'from-indigo-500 to-blue-500' },
  listening_quiz: { icon: '🎧', name: 'Listening Quiz', color: 'from-green-500 to-emerald-500' },
  idiom_master: { icon: '🎭', name: 'Idiom Master', color: 'from-fuchsia-500 to-purple-500' },
  last_word: { icon: '🔤', name: 'Last Word', color: 'from-orange-500 to-red-500' },
};

interface Props { onBack: () => void; }

export const GameStats = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStat[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase.from('game_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const grouped: Record<string, { scores: number[]; dates: string[] }> = {};
      data.forEach(d => {
        if (!grouped[d.game_type]) grouped[d.game_type] = { scores: [], dates: [] };
        grouped[d.game_type].scores.push(d.score);
        grouped[d.game_type].dates.push(d.created_at);
      });

      const gameStats: GameStat[] = Object.entries(grouped).map(([type, { scores, dates }]) => ({
        game_type: type,
        total_games: scores.length,
        total_score: scores.reduce((a, b) => a + b, 0),
        avg_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        best_score: Math.max(...scores),
        last_played: dates[0],
      }));

      gameStats.sort((a, b) => b.total_games - a.total_games);
      setStats(gameStats);
      setTotalGames(data.length);
      setTotalScore(data.reduce((a, b) => a + b.score, 0));
    }
    setLoading(false);
  };

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} daqiqa oldin`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat oldin`;
    const days = Math.floor(hours / 24);
    return `${days} kun oldin`;
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
      </div>
    );
  }

  const maxScore = Math.max(...stats.map(s => s.best_score), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Statistika
        </h2>
        <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Gamepad2, label: "Jami o'yinlar", value: totalGames, color: 'text-primary' },
          { icon: Trophy, label: "Jami ball", value: totalScore, color: 'text-amber-500' },
          { icon: Target, label: "O'yin turlari", value: stats.length, color: 'text-emerald-500' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-elevated p-4 text-center"
          >
            <card.icon className={`w-6 h-6 mx-auto mb-2 ${card.color}`} />
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Per-game stats */}
      {stats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Hali o'yin o'ynalmagan</p>
          <p className="text-sm mt-1">O'yinlarni o'ynab statistikangizni ko'ring!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((stat, i) => {
            const info = GAME_INFO[stat.game_type] || { icon: '🎮', name: stat.game_type, color: 'from-gray-500 to-gray-600' };
            return (
              <motion.div
                key={stat.game_type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-elevated p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-lg`}>
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm">{info.name}</h4>
                      <span className="text-xs text-muted-foreground">{getTimeSince(stat.last_played)}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs mb-2">
                      <div>
                        <p className="text-muted-foreground">O'yinlar</p>
                        <p className="font-bold">{stat.total_games}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Jami ball</p>
                        <p className="font-bold">{stat.total_score}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">O'rtacha</p>
                        <p className="font-bold">{stat.avg_score}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Eng yaxshi</p>
                        <p className="font-bold text-primary">{stat.best_score}</p>
                      </div>
                    </div>

                    <Progress value={(stat.best_score / maxScore) * 100} className="h-1.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
