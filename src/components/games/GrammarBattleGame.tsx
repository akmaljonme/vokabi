import { useState } from 'react';
import { motion } from 'framer-motion';
import { grammarQuestions, GrammarQuestion } from '@/data/gameData';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Check, X, Timer, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect } from 'react';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';

interface Props { onBack: () => void; }

export const GrammarBattleGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [started, setStarted] = useState(false);
  const ai = useAIGameQuestions<GrammarQuestion>('grammar_battle');

  const startWithAI = async () => {
    const aiQ = await ai.generate('B1');
    if (aiQ && aiQ.length >= 4) {
      setQuestions(aiQ.slice(0, 8));
    } else {
      setQuestions([...grammarQuestions].sort(() => Math.random() - 0.5).slice(0, 8));
    }
    setStarted(true);
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setGameOver(false);
    setTimeLeft(15);
  };

  useEffect(() => {
    if (!started || gameOver || selected !== null) return;
    if (timeLeft <= 0) { nextQuestion(); return; }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started, gameOver, selected]);

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setGameOver(true);
      saveScore();
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setTimeLeft(15);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[currentIdx].correct) setScore(s => s + 1);
    setTimeout(nextQuestion, 1500);
  };

  const saveScore = async () => {
    if (!user) return;
    const finalScore = score;
    await supabase.from('game_scores').insert({ user_id: user.id, game_type: 'grammar_battle', score: finalScore, level: 'mixed' });
    toast({ title: '⚔️ Grammar Battle', description: `${finalScore}/${questions.length} to'g'ri! +${finalScore * 20} XP` });
  };

  if (!started) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-4">⚔️</div>
        <h2 className="text-2xl font-bold mb-2">Grammar Battle</h2>
        <p className="text-muted-foreground mb-6">Har bir savol uchun 15 soniya! Tayyor bo'ling!</p>
        <Button size="lg" onClick={startWithAI} disabled={ai.loading}>
          {ai.loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Savollar tayyorlanmoqda...</> : 'Boshlash!'}
        </Button>
      </motion.div>
    );
  }

  if (gameOver) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-4">{pct >= 70 ? '🏆' : pct >= 40 ? '💪' : '📚'}</div>
        <h3 className="text-2xl font-bold mb-2">{pct}% to'g'ri</h3>
        <p className="text-muted-foreground mb-6">{score}/{questions.length} savol</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setCurrentIdx(0); setScore(0); setSelected(null); setGameOver(false); setTimeLeft(15); }}>Qayta o'ynash</Button>
          <Button variant="outline" onClick={onBack}>Boshqa o'yin</Button>
        </div>
      </motion.div>
    );
  }

  const q = questions[currentIdx];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-muted-foreground" />
          <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-500' : ''}`}>{timeLeft}s</span>
        </div>
        <span className="text-sm font-medium">Score: {score}</span>
      </div>

      <Progress value={(timeLeft / 15) * 100} className="mb-6 h-1.5" />

      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <p className="text-lg font-medium text-center">{q.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAnswer(i)}
            disabled={selected !== null}
            className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
              selected === null ? 'border-border hover:border-primary/50 bg-card' :
              i === q.correct ? 'border-green-500 bg-green-500/10' :
              i === selected ? 'border-red-500 bg-red-500/10' :
              'border-border bg-card opacity-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {selected !== null && i === q.correct && <Check className="w-4 h-4 text-green-500" />}
              {selected === i && i !== q.correct && <X className="w-4 h-4 text-red-500" />}
              {opt}
            </div>
          </motion.button>
        ))}
      </div>

      {selected !== null && (
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center text-sm text-muted-foreground">
          💡 {q.explanation}
        </motion.p>
      )}
    </motion.div>
  );
};
