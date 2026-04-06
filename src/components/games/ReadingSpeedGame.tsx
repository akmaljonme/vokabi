import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const passages = [
  { text: 'The sun was setting behind the mountains, painting the sky in shades of orange and pink. A gentle breeze carried the scent of wildflowers across the valley. Birds were returning to their nests, their songs filling the quiet evening air. It was a perfect moment of peace and beauty that made everything seem right in the world.', question: 'What time of day is described?', options: ['Morning', 'Evening', 'Afternoon', 'Night'], correct: 1 },
  { text: 'Libraries are more than just buildings full of books. They are community centers where people of all ages come to learn, discover, and connect. Modern libraries offer digital resources, workshops, and meeting spaces. They play a vital role in providing equal access to information and education for everyone.', question: 'What is the main idea?', options: ['Books are old', 'Libraries are important community centers', 'People don\'t read', 'Libraries are expensive'], correct: 1 },
  { text: 'Water covers about 71 percent of the Earth\'s surface. Most of it is found in the oceans, which contain about 96.5 percent of all Earth\'s water. Only about 2.5 percent is freshwater, and less than 1 percent of that is easily accessible for human use. This makes water conservation extremely important for our future.', question: 'How much of Earth\'s water is freshwater?', options: ['71%', '96.5%', '2.5%', '1%'], correct: 2 },
];

export const ReadingSpeedGame = ({ onBack }: { onBack: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'reading' | 'question' | 'done'>('ready');
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const start = () => { setPhase('reading'); setStartTime(Date.now()); };

  const finishReading = () => {
    const elapsed = (Date.now() - startTime) / 60000;
    const words = passages[current].text.split(' ').length;
    setWpm(Math.round(words / elapsed));
    setPhase('question');
  };

  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === passages[current].correct) setScore(s => s + 20);
    setTimeout(() => {
      if (current + 1 >= passages.length) { setPhase('done'); confetti({ particleCount: 100 }); }
      else { setCurrent(c => c + 1); setPhase('ready'); setSelected(null); }
    }, 1200);
  };

  if (phase === 'done') return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <div className="text-6xl mb-4">📖</div><h2 className="text-3xl font-bold mb-2">{score} XP</h2>
      <p className="text-muted-foreground mb-4">O'rtacha tezlik: {wpm} WPM</p>
      <Button onClick={onBack}>Orqaga</Button>
    </motion.div>
  );

  const p = passages[current];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">⚡ Reading Speed</h2>
        <span className="ml-auto font-bold text-primary">{score} XP</span>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        {phase === 'ready' && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-lg mb-4">Matnni imkon qadar tez o'qing!</p>
            <Button onClick={start} size="lg"><Play className="w-4 h-4 mr-2" /> Boshlash</Button>
          </div>
        )}
        {phase === 'reading' && (
          <div>
            <p className="text-lg leading-relaxed mb-6">{p.text}</p>
            <Button className="w-full" onClick={finishReading}>O'qib bo'ldim ✓</Button>
          </div>
        )}
        {phase === 'question' && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tezlik: <span className="font-bold text-primary">{wpm} WPM</span></p>
            <p className="text-lg font-bold mb-4">{p.question}</p>
            <div className="grid grid-cols-2 gap-3">
              {p.options.map((opt, i) => (
                <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => answer(i)}
                  className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${selected === null ? 'border-border hover:border-primary' : i === p.correct ? 'border-green-500 bg-green-500/10' : selected === i ? 'border-red-500 bg-red-500/10' : 'border-border opacity-50'}`}
                >{opt}</motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
