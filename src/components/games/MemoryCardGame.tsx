import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const pairs = [
  { en: 'Dog', uz: 'It' }, { en: 'Cat', uz: 'Mushuk' }, { en: 'House', uz: 'Uy' },
  { en: 'Water', uz: 'Suv' }, { en: 'Book', uz: 'Kitob' }, { en: 'Sun', uz: 'Quyosh' },
  { en: 'Moon', uz: 'Oy' }, { en: 'Tree', uz: 'Daraxt' },
];

type Card = { id: number; text: string; pairId: number; flipped: boolean; matched: boolean };

export const MemoryCardGame = ({ onBack }: { onBack: () => void }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const init = () => {
    const c: Card[] = [];
    pairs.forEach((p, i) => {
      c.push({ id: i * 2, text: p.en, pairId: i, flipped: false, matched: false });
      c.push({ id: i * 2 + 1, text: p.uz, pairId: i, flipped: false, matched: false });
    });
    setCards(c.sort(() => Math.random() - 0.5));
    setFlippedIds([]);
    setMoves(0);
    setDone(false);
  };

  useEffect(() => { init(); }, []);

  const flip = (id: number) => {
    if (flippedIds.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          const matched = newCards.map(c => c.pairId === a.pairId ? { ...c, matched: true } : c);
          setCards(matched);
          setFlippedIds([]);
          if (matched.every(c => c.matched)) { setDone(true); confetti({ particleCount: 100 }); }
        }, 500);
      } else {
        setTimeout(() => {
          setCards(newCards.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
      <div className="text-6xl mb-4">🧠</div>
      <h2 className="text-3xl font-bold mb-2">Ajoyib!</h2>
      <p className="text-muted-foreground mb-2">{moves} harakatda</p>
      <p className="text-xl font-bold text-primary mb-4">{Math.max(100 - moves * 3, 30)} XP</p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={init}><RotateCcw className="w-4 h-4 mr-2" /> Qayta</Button>
        <Button onClick={onBack}>Orqaga</Button>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">🧠 Memory Cards</h2>
        <span className="ml-auto text-sm text-muted-foreground">Harakatlar: {moves}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map(card => (
          <motion.button key={card.id} whileTap={{ scale: 0.95 }} onClick={() => flip(card.id)}
            className={`aspect-square rounded-xl font-bold text-sm flex items-center justify-center transition-all ${card.matched ? 'bg-primary/20 border-2 border-primary text-primary' : card.flipped ? 'bg-card border-2 border-primary' : 'bg-muted border-2 border-border hover:border-primary/50'}`}
          >
            {card.flipped || card.matched ? card.text : '?'}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
