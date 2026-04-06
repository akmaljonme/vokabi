import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

type CQ = { word: string; collocate: string; options: string[] };
const data: CQ[] = [
  { word: 'Make', collocate: 'a decision', options: ['a decision', 'a work', 'a travel', 'a fun'] },
  { word: 'Do', collocate: 'homework', options: ['a mistake', 'homework', 'a plan', 'a trip'] },
  { word: 'Take', collocate: 'a photo', options: ['a homework', 'a photo', 'a work', 'a decision'] },
  { word: 'Pay', collocate: 'attention', options: ['money', 'care', 'attention', 'time'] },
  { word: 'Have', collocate: 'a rest', options: ['a rest', 'a do', 'a make', 'a go'] },
  { word: 'Break', collocate: 'a record', options: ['a news', 'a record', 'a work', 'a home'] },
  { word: 'Catch', collocate: 'a cold', options: ['a hot', 'a cold', 'a warm', 'a cool'] },
  { word: 'Keep', collocate: 'a promise', options: ['a word', 'a promise', 'a talk', 'a say'] },
];

export const CollocationsGame = ({ onBack }: { onBack: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const correctIdx = data[current].options.indexOf(data[current].collocate);

  const select = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === correctIdx) setScore(s => s + 15);
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
        <h2 className="text-2xl font-bold">🧲 Collocations</h2>
        <span className="ml-auto font-bold text-primary">{score} XP</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-6"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((current+1)/data.length)*100}%` }}/></div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-center text-muted-foreground mb-2">To'g'ri juftlikni toping:</p>
        <p className="text-3xl font-bold text-center mb-6 text-primary">{data[current].word} + ?</p>
        <div className="grid grid-cols-2 gap-3">
          {data[current].options.map((opt, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => select(i)}
              className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${selected === null ? 'border-border hover:border-primary' : i === correctIdx ? 'border-green-500 bg-green-500/10' : selected === i ? 'border-red-500 bg-red-500/10' : 'border-border opacity-50'}`}
            >{opt}</motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
