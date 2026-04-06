import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

type PQ = { sentence: string; options: string[]; correct: number };
const data: PQ[] = [
  { sentence: 'The book is ___ the table.', options: ['on', 'in', 'at', 'by'], correct: 0 },
  { sentence: 'She arrived ___ Monday.', options: ['in', 'at', 'on', 'by'], correct: 2 },
  { sentence: 'He lives ___ London.', options: ['on', 'at', 'in', 'to'], correct: 2 },
  { sentence: 'We meet ___ 5 o\'clock.', options: ['in', 'on', 'by', 'at'], correct: 3 },
  { sentence: 'The cat jumped ___ the box.', options: ['into', 'on', 'at', 'by'], correct: 0 },
  { sentence: 'I\'m interested ___ music.', options: ['on', 'at', 'in', 'for'], correct: 2 },
  { sentence: 'She\'s good ___ dancing.', options: ['in', 'at', 'on', 'for'], correct: 1 },
  { sentence: 'We waited ___ the bus stop.', options: ['in', 'on', 'at', 'to'], correct: 2 },
];

export const PrepositionGame = ({ onBack }: { onBack: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const select = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === data[current].correct) setScore(s => s + 15);
    setTimeout(() => {
      if (current + 1 >= data.length) { setDone(true); confetti({ particleCount: 80 }); }
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 1000);
  };

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <div className="text-6xl mb-4">🏆</div><h2 className="text-3xl font-bold">{score} XP</h2>
      <Button onClick={onBack} className="mt-4">Orqaga</Button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">📍 Preposition Master</h2>
        <span className="ml-auto font-bold text-primary">{score} XP</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-6"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((current+1)/data.length)*100}%` }}/></div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-xl font-bold text-center mb-6">{data[current].sentence}</p>
        <div className="grid grid-cols-2 gap-3">
          {data[current].options.map((opt, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => select(i)}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${selected === null ? 'border-border hover:border-primary' : i === data[current].correct ? 'border-green-500 bg-green-500/10' : selected === i ? 'border-red-500 bg-red-500/10' : 'border-border opacity-50'}`}
            >{opt}</motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
