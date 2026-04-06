import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';
import confetti from 'canvas-confetti';

type ScrambleQ = { word: string; hint: string };
const fallback: ScrambleQ[] = [
  { word: 'BEAUTIFUL', hint: 'Chiroyli' }, { word: 'ELEPHANT', hint: 'Fil' },
  { word: 'LIBRARY', hint: 'Kutubxona' }, { word: 'MORNING', hint: 'Ertalab' },
  { word: 'KITCHEN', hint: 'Oshxona' }, { word: 'GARDEN', hint: 'Bog\'' },
  { word: 'TEACHER', hint: 'O\'qituvchi' }, { word: 'WINDOW', hint: 'Deraza' },
];

const scramble = (w: string) => w.split('').sort(() => Math.random() - 0.5).join('');

export const WordScrambleGame = ({ onBack }: { onBack: () => void }) => {
  const [questions, setQuestions] = useState<ScrambleQ[]>(fallback);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const { generate, loading } = useAIGameQuestions<ScrambleQ>('spelling_bee');

  useEffect(() => {
    generate('A2').then(r => { if (r) setQuestions(r.map(q => ({ word: q.word.toUpperCase(), hint: q.hint }))); });
  }, []);

  useEffect(() => {
    if (questions[current]) setScrambled(scramble(questions[current].word));
  }, [current, questions]);

  const check = () => {
    if (input.toUpperCase() === questions[current].word) {
      setScore(s => s + 15);
      if (current + 1 >= questions.length) {
        setDone(true);
        confetti({ particleCount: 100, spread: 60 });
      } else {
        setCurrent(c => c + 1);
        setInput('');
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 max-w-md mx-auto">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold mb-2">Ajoyib!</h2>
      <p className="text-xl text-primary font-bold mb-6">{score} XP</p>
      <Button onClick={onBack}>Orqaga</Button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">🔀 Word Scramble</h2>
        <span className="ml-auto font-bold text-primary">{score} XP</span>
      </div>
      <div className="text-center text-sm text-muted-foreground mb-2">{current + 1}/{questions.length}</div>
      <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-4xl font-mono font-bold tracking-[0.3em] mb-4 text-primary">{scrambled}</p>
        <p className="text-sm text-muted-foreground mb-4">💡 {questions[current]?.hint}</p>
        <input
          className="w-full text-center text-2xl font-bold bg-muted/50 rounded-xl p-3 outline-none border-2 border-transparent focus:border-primary transition-colors"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="So'zni yozing..."
        />
        <Button className="mt-4 w-full" onClick={check}>Tekshirish</Button>
      </motion.div>
    </motion.div>
  );
};
