import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Flame, Clock, CheckCircle, ChevronRight, Trophy, Sparkles, Target, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';

interface Challenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  challenge_data: {
    questions: {
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }[];
  };
  xp_reward: number;
  difficulty: string;
  challenge_date: string;
}

interface CompletedChallenge {
  challenge_id: string;
  score: number;
  xp_earned: number;
}

const difficultyConfig: Record<string, { color: string; label: string; icon: string }> = {
  easy: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Oson', icon: '🌱' },
  medium: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: "O'rta", icon: '⚡' },
  hard: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Qiyin', icon: '🔥' },
};

const typeIcons: Record<string, string> = {
  vocabulary: '📚', grammar: '✏️', reading: '📖',
  listening_comprehension: '🎧', sentence_building: '🧩',
};

export const DailyChallenges = () => {
  const { user } = useAuth();
  const { progress, addXP } = useGamification();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completed, setCompleted] = useState<CompletedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [challengeComplete, setChallengeComplete] = useState(false);

  const streakMultiplier = Math.min(3.0, 1.0 + (progress?.current_streak || 0) * 0.1);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch or generate today's challenges
      const { data } = await supabase.functions.invoke('generate-daily-challenges');
      if (data?.challenges) setChallenges(data.challenges);

      // Fetch completions
      const today = new Date().toISOString().split('T')[0];
      const { data: comps } = await supabase
        .from('user_daily_challenges' as any)
        .select('challenge_id, score, xp_earned')
        .eq('user_id', user.id);
      
      if (comps) {
        const todayChallengeIds = (data?.challenges || []).map((c: Challenge) => c.id);
        setCompleted(
          (comps as any[]).filter((c: any) => todayChallengeIds.includes(c.challenge_id))
        );
      }
    } catch (err) {
      console.error('Daily challenges error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const isCompleted = (id: string) => completed.some(c => c.challenge_id === id);
  const completedCount = challenges.filter(c => isCompleted(c.id)).length;

  // Countdown to midnight
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const startChallenge = (challenge: Challenge) => {
    if (isCompleted(challenge.id)) return;
    setActiveChallenge(challenge);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setChallengeComplete(false);
  };

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    const q = activeChallenge!.challenge_data.questions[currentQ];
    if (idx === q.correct) setScore(s => s + 1);
  };

  const nextQuestion = async () => {
    const questions = activeChallenge!.challenge_data.questions;
    if (currentQ + 1 >= questions.length) {
      // Challenge complete
      setChallengeComplete(true);
      const baseXP = activeChallenge!.xp_reward;
      const earnedXP = Math.round(baseXP * (score / questions.length) * streakMultiplier);

      try {
        await supabase.from('user_daily_challenges' as any).insert({
          user_id: user!.id,
          challenge_id: activeChallenge!.id,
          score,
          xp_earned: earnedXP,
          streak_multiplier: streakMultiplier,
        } as any);

        await addXP(earnedXP);
        setCompleted(prev => [...prev, {
          challenge_id: activeChallenge!.id,
          score,
          xp_earned: earnedXP,
        }]);
      } catch (err) {
        console.error('Save challenge error:', err);
      }
    } else {
      setCurrentQ(q => q + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const closeChallenge = () => {
    setActiveChallenge(null);
    setChallengeComplete(false);
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Kunlik challengelar yuklanmoqda...</p>
        </CardContent>
      </Card>
    );
  }

  // Active challenge quiz mode
  if (activeChallenge && !challengeComplete) {
    const questions = activeChallenge.challenge_data.questions;
    const q = questions[currentQ];
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{typeIcons[activeChallenge.challenge_type] || '📝'}</span>
                <CardTitle className="text-base">{activeChallenge.title}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={closeChallenge}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{currentQ + 1} / {questions.length}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold text-sm">{q.question}</p>
            <div className="grid gap-2">
              {q.options.map((opt, i) => {
                let cls = 'border-border/50 hover:border-primary/50 hover:bg-primary/5';
                if (showResult) {
                  if (i === q.correct) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-700';
                  else if (i === selectedAnswer && i !== q.correct) cls = 'border-red-500 bg-red-500/10 text-red-700';
                  else cls = 'border-border/30 opacity-50';
                } else if (selectedAnswer === i) {
                  cls = 'border-primary bg-primary/10';
                }
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(i)}
                    className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${cls}`}
                    disabled={showResult}
                  >
                    <span className="font-medium mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
            {showResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  💡 {q.explanation}
                </p>
                <Button onClick={nextQuestion} className="w-full">
                  {currentQ + 1 >= questions.length ? 'Yakunlash' : 'Keyingi savol'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Challenge complete screen
  if (activeChallenge && challengeComplete) {
    const questions = activeChallenge.challenge_data.questions;
    const baseXP = activeChallenge.xp_reward;
    const earnedXP = Math.round(baseXP * (score / questions.length) * streakMultiplier);
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="pt-8 pb-6 text-center relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              {percentage >= 80 ? (
                <Trophy className="w-10 h-10 text-primary" />
              ) : (
                <Target className="w-10 h-10 text-primary" />
              )}
            </motion.div>
            <h3 className="font-display font-bold text-xl mb-1">
              {percentage >= 80 ? 'Ajoyib!' : percentage >= 50 ? 'Yaxshi!' : 'Davom eting!'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {score}/{questions.length} to'g'ri javob ({percentage}%)
            </p>

            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="font-display font-bold text-2xl text-primary">+{earnedXP}</span>
                </div>
                <p className="text-xs text-muted-foreground">XP olindi</p>
              </div>
              {streakMultiplier > 1 && (
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-display font-bold text-2xl text-orange-500">x{streakMultiplier.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Streak bonus</p>
                </div>
              )}
            </div>

            <Button onClick={closeChallenge} className="w-full">
              Davom etish
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Main challenges list
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Kunlik Challengelar</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Har kuni yangi challengelar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streakMultiplier > 1 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                x{streakMultiplier.toFixed(1)}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              {timeLeft}
            </Badge>
          </div>
        </div>
        {challenges.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{completedCount}/{challenges.length} bajarildi</span>
              {completedCount === challenges.length && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Barchasi bajarildi!
                </span>
              )}
            </div>
            <Progress value={(completedCount / challenges.length) * 100} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {challenges.map((challenge, i) => {
            const done = isCompleted(challenge.id);
            const comp = completed.find(c => c.challenge_id === challenge.id);
            const diff = difficultyConfig[challenge.difficulty] || difficultyConfig.medium;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <button
                  onClick={() => startChallenge(challenge)}
                  disabled={done}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    done
                      ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80'
                      : 'border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl shrink-0">
                      {done ? '✅' : typeIcons[challenge.challenge_type] || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{challenge.title}</span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${diff.color}`}>
                          {diff.icon} {diff.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{challenge.description}</p>
                      {done && comp ? (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-emerald-600 font-semibold">+{comp.xp_earned} XP</span>
                          <span className="text-xs text-muted-foreground">• {comp.score}/5 to'g'ri</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Zap className="w-3 h-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">
                            {Math.round(challenge.xp_reward * streakMultiplier)} XP
                          </span>
                          {streakMultiplier > 1 && (
                            <span className="text-[10px] text-muted-foreground line-through ml-1">{challenge.xp_reward}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {!done && <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {challenges.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Bugungi challengelar hali tayyor emas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
