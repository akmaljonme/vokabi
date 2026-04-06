import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';
import confetti from 'canvas-confetti';

type VQ = { question: string; options: string[]; correct: number; explanation: string };
const fallback: VQ[] = [
  { question: 'By next year, I ___ here for 5 years.', options: ['will work', 'will have worked', 'worked', 'work'], correct: 1, explanation: 'Future Perfect' },
  { question: 'She ___ when I called her.', options: ['sleeps', 'slept', 'was sleeping', 'has slept'], correct: 2, explanation: 'Past Continuous' },
  { question: 'I ___ this movie before.', options: ['see', 'saw', 'have seen', 'seeing'], correct: 2, explanation: 'Present Perfect' },
  { question: 'They ___ football every Sunday.', options: ['play', 'plays', 'played', 'playing'], correct: 0, explanation: 'Simple Present' },
  { question: 'He ___ to Paris next week.', options: ['goes', 'went', 'is going', 'go'], correct: 2, explanation: 'Present Continuous (future)' },
  { question: 'We ___ dinner when the lights went out.', options: ['eat', 'ate', 'were eating', 'have eaten'], correct: 2, explanation: 'Past Continuous' },
];

export const VerbTenseGame = ({ onBack }: { onBack: () => void }) => {
  const [questions, setQuestions] = useState<VQ[]>(fallback);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { generate } = useAIGameQuestions<VQ>('grammar_battle');

  useEffect(() => { generate('B1').then(r => { if (r) setQuestions(r); }); }, []);

  const select = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === questions[current].correct) setScore(s => s + 15);
    setTimeout(() => {
      if (current + 1 >= questions.length) { setDone(true); confetti({ particleCount: 80 }); }
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 1200);
  };

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <div className="text-6xl mb-4">🏆</div><h2 className="text-3xl font-bold">{score} XP</h2>
      <Button onClick={onBack} className="mt-4">Orqaga</Button>
    </motion.div>
  );

  const q = questions[current];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">⏰ Verb Tenses</h2>
        <span className="ml-auto font-bold text-primary">{score} XP</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-6"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((current+1)/questions.length)*100}%` }}/></div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-xl font-bold text-center mb-6">{q.question}</p>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => select(i)}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${selected === null ? 'border-border hover:border-primary' : i === q.correct ? 'border-green-500 bg-green-500/10' : selected === i ? 'border-red-500 bg-red-500/10' : 'border-border opacity-50'}`}
            >{opt}</motion.button>
          ))}
        </div>
        {selected !== null && <p className="text-sm text-muted-foreground mt-3 text-center">💡 {q.explanation}</p>}
      </div>
    </motion.div>
  );
};
