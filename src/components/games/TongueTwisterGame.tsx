import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const twisters = [
  { text: 'She sells seashells by the seashore.', difficulty: 'Easy', translation: 'U dengiz qirg\'og\'ida chig\'anoqlar sotadi.' },
  { text: 'How much wood would a woodchuck chuck?', difficulty: 'Medium', translation: 'Yog\'ochqush qancha yog\'och tashlar edi?' },
  { text: 'Peter Piper picked a peck of pickled peppers.', difficulty: 'Medium', translation: 'Piter Payper bir chelak tuzlangan qalampir terdi.' },
  { text: 'Red lorry, yellow lorry, red lorry, yellow lorry.', difficulty: 'Hard', translation: 'Qizil yuk mashinasi, sariq yuk mashinasi...' },
  { text: 'Betty Botter bought some butter.', difficulty: 'Easy', translation: 'Betti Botter biroz sariyog\' sotib oldi.' },
  { text: 'Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair.', difficulty: 'Medium', translation: 'Fuzzy Wuzzy ayiq edi. Fuzzy Wuzzy sochi yo\'q edi.' },
  { text: 'I scream, you scream, we all scream for ice cream!', difficulty: 'Easy', translation: 'Men baqiraman, sen baqirasan, hammamiz muzqaymoq uchun baqiramiz!' },
  { text: 'The sixth sick sheikh\'s sixth sheep\'s sick.', difficulty: 'Hard', translation: 'Oltinchi kasal shayxning oltinchi qo\'yi kasal.' },
];

export const TongueTwisterGame = ({ onBack }: { onBack: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [practiced, setPracticed] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  const markDone = () => {
    const newSet = new Set(practiced);
    newSet.add(current);
    setPracticed(newSet);
    if (newSet.size >= twisters.length) { setDone(true); confetti({ particleCount: 100 }); }
  };

  const next = () => setCurrent(c => (c + 1) % twisters.length);

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <div className="text-6xl mb-4">🎉</div><h2 className="text-3xl font-bold mb-2">Hammasi mashq qilindi!</h2>
      <p className="text-primary font-bold text-xl mb-4">{twisters.length * 10} XP</p>
      <Button onClick={onBack}>Orqaga</Button>
    </motion.div>
  );

  const tw = twisters[current];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">👅 Tongue Twisters</h2>
        <span className="ml-auto text-sm text-muted-foreground">{practiced.size}/{twisters.length}</span>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tw.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' : tw.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>{tw.difficulty}</span>
        <p className="text-2xl font-bold mt-4 mb-2 leading-relaxed">{tw.text}</p>
        <p className="text-sm text-muted-foreground mb-6">{tw.translation}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => speak(tw.text)}><Volume2 className="w-4 h-4 mr-2" /> Eshitish</Button>
          <Button variant={practiced.has(current) ? 'secondary' : 'default'} onClick={markDone}>
            <CheckCircle className="w-4 h-4 mr-2" /> {practiced.has(current) ? 'Bajarildi ✓' : 'Mashq qildim'}
          </Button>
          <Button variant="ghost" size="icon" onClick={next}><ArrowRight className="w-5 h-5" /></Button>
        </div>
      </div>
    </motion.div>
  );
};
