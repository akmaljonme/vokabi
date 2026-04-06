import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

type SQ = { word: string; synonym: string; options: string[] };
const data: SQ[] = [
  { word: 'Happy', synonym: 'Joyful', options: ['Sad', 'Joyful', 'Angry', 'Tired'] },
  { word: 'Big', synonym: 'Large', options: ['Small', 'Tiny', 'Large', 'Short'] },
  { word: 'Fast', synonym: 'Quick', options: ['Slow', 'Quick', 'Heavy', 'Late'] },
  { word: 'Smart', synonym: 'Intelligent', options: ['Dumb', 'Lazy', 'Intelligent', 'Weak'] },
  { word: 'Beautiful', synonym: 'Gorgeous', options: ['Ugly', 'Gorgeous', 'Plain', 'Dark'] },
  { word: 'Begin', synonym: 'Start', options: ['End', 'Stop', 'Start', 'Pause'] },
  { word: 'Brave', synonym: 'Courageous', options: ['Scared', 'Courageous', 'Weak', 'Shy'] },
  { word: 'Angry', synonym: 'Furious', options: ['Calm', 'Happy', 'Furious', 'Quiet'] },
];

export const SynonymGame = ({ onBack }: { onBack: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const select = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (data[current].options[i] === data[current].synonym) setScore(s => s + 15);
    setTimeout(() => {
      if (current + 1 >= data.length) { setDone(true); confetti({ particleCount: 80 }); }
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 1000);
  };

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <div className="text-6xl mb-4">🏆</div><h2 className="text-3xl font-bold mb-2">{score} XP</h2>
      <Button onClick={onBack} className="mt-4">Orqaga</Button>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">🔄 Synonyms</h2>
        <span className="ml-auto font-bold text-primary">{score} XP</span>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-center text-muted-foreground mb-2">Sinonimini toping:</p>
        <p className="text-3xl font-bold text-center mb-6 text-primary">{data[current].word}</p>
        <div className="grid grid-cols-2 gap-3">
          {data[current].options.map((opt, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => select(i)}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${selected === null ? 'border-border hover:border-primary' : opt === data[current].synonym ? 'border-green-500 bg-green-500/10' : selected === i ? 'border-red-500 bg-red-500/10' : 'border-border opacity-50'}`}
            >{opt}</motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
