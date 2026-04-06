import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

type TFQ = { statement: string; isTrue: boolean; explanation: string };
const data: TFQ[] = [
  { statement: '"I have been to London" is Present Perfect.', isTrue: true, explanation: 'have/has + V3 = Present Perfect' },
  { statement: '"She don\'t like coffee" is grammatically correct.', isTrue: false, explanation: 'To\'g\'risi: She doesn\'t like coffee' },
  { statement: 'An adverb modifies a noun.', isTrue: false, explanation: 'Adverb fe\'l, sifat yoki boshqa ravishni tavsiflaydi' },
  { statement: '"Information" is an uncountable noun.', isTrue: true, explanation: 'Information — sanalmaydigan ot' },
  { statement: '"The" is a definite article.', isTrue: true, explanation: 'The — aniq artikl' },
  { statement: '"Their" and "There" have the same meaning.', isTrue: false, explanation: 'Their = ularning, There = u yerda' },
  { statement: 'Past participle of "go" is "gone".', isTrue: true, explanation: 'go - went - gone' },
  { statement: '"Which" is used for people.', isTrue: false, explanation: 'Which — narsalar uchun, Who — odamlar uchun' },
];

export const TrueFalseGame = ({ onBack }: { onBack: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const answer = (val: boolean) => {
    if (answered !== null) return;
    setAnswered(val);
    if (val === data[current].isTrue) setScore(s => s + 15);
    setTimeout(() => {
      if (current + 1 >= data.length) { setDone(true); confetti({ particleCount: 80 }); }
      else { setCurrent(c => c + 1); setAnswered(null); }
    }, 1500);
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
        <h2 className="text-2xl font-bold">✅ True or False</h2>
        <span className="ml-auto font-bold text-primary">{score} XP</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-6"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((current+1)/data.length)*100}%` }}/></div>
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-xl font-bold mb-6 leading-relaxed">{data[current].statement}</p>
        <div className="flex gap-4 justify-center">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => answer(true)}
            className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold text-lg transition-all ${answered === null ? 'border-green-500/50 hover:bg-green-500/10' : data[current].isTrue ? 'border-green-500 bg-green-500/20' : answered === true ? 'border-red-500 bg-red-500/10' : 'border-border opacity-50'}`}>
            <Check className="w-8 h-8" /> True
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => answer(false)}
            className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold text-lg transition-all ${answered === null ? 'border-red-500/50 hover:bg-red-500/10' : !data[current].isTrue ? 'border-green-500 bg-green-500/20' : answered === false ? 'border-red-500 bg-red-500/10' : 'border-border opacity-50'}`}>
            <X className="w-8 h-8" /> False
          </motion.button>
        </div>
        {answered !== null && <p className="text-sm text-muted-foreground mt-4">💡 {data[current].explanation}</p>}
      </div>
    </motion.div>
  );
};
