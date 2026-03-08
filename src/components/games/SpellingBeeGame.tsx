import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { spellingWords } from '@/data/gameData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';

interface Props { onBack: () => void; }

export const SpellingBeeGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | null>(null);
  const [words, setWords] = useState<typeof spellingWords['A1']>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ai = useAIGameQuestions<{ word: string; hint: string }>('spelling_bee');

  useEffect(() => { inputRef.current?.focus(); }, [currentIdx, level]);

  const startGame = async (lvl: string) => {
    setLevel(lvl);
    const aiWords = await ai.generate(lvl);
    if (aiWords && aiWords.length >= 4) {
      setWords(aiWords.map(w => ({ ...w, level: lvl })));
    } else {
      setWords([...(spellingWords[lvl] || spellingWords['A1'])].sort(() => Math.random() - 0.5));
    }
    setCurrentIdx(0); setScore(0); setGameOver(false); setInput(''); setFeedback(null);
  };

  const checkAnswer = () => {
    const correct = input.trim().toLowerCase() === words[currentIdx].word.toLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      setFeedback(null); setInput('');
      if (currentIdx + 1 >= words.length) {
        setGameOver(true);
        saveScore(correct ? score + 1 : score);
      } else {
        setCurrentIdx(i => i + 1);
      }
    }, 1200);
  };

  const saveScore = async (s: number) => {
    if (!user) return;
    await supabase.from('game_scores').insert({ user_id: user.id, game_type: 'spelling_bee', score: s, level: level || 'A1' });
    toast({ title: '🐝 Spelling Bee', description: `${s}/${words.length} to'g'ri! +${s * 15} XP` });
  };

  if (!level) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">🐝 Spelling Bee</h2>
        <p className="text-muted-foreground mb-6">Daraja tanlang:</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(spellingWords).map(l => (
            <Button key={l} variant="outline" size="lg" onClick={() => startGame(l)} className="text-lg">{l}</Button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (gameOver) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-4">{score >= words.length * 0.7 ? '🏆' : '💪'}</div>
        <h3 className="text-2xl font-bold mb-2">{score >= words.length * 0.7 ? 'Ajoyib natija!' : 'Yaxshi harakat!'}</h3>
        <p className="text-muted-foreground mb-6">{score}/{words.length} to'g'ri</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => startGame(level)}>Qayta o'ynash</Button>
          <Button variant="outline" onClick={onBack}>Boshqa o'yin</Button>
        </div>
      </motion.div>
    );
  }

  const word = words[currentIdx];
  const maskedWord = word.word.split('').map((c, i) => (i === 0 || i === word.word.length - 1) ? c : '_').join(' ');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
        <span className="text-sm text-muted-foreground">{currentIdx + 1}/{words.length}</span>
        <span className="text-sm font-medium">Score: {score}</span>
        <Button variant="ghost" size="sm" onClick={onBack}>Orqaga</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm mb-2">Hint: {word.hint}</p>
        <p className="text-2xl font-mono tracking-widest mb-6">{maskedWord}</p>

        <form onSubmit={(e) => { e.preventDefault(); checkAnswer(); }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="So'zni yozing..."
            disabled={feedback !== null}
            className="text-center text-lg"
          />
          <Button type="submit" disabled={!input.trim() || feedback !== null}>Tekshirish</Button>
        </form>

        {feedback && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
            {feedback === 'correct' ? <><Check className="w-5 h-5" /> To'g'ri!</> : <><X className="w-5 h-5" /> {word.word}</>}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
