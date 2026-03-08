import { useState } from 'react';
import { motion } from 'framer-motion';
import { flashcards, FlashCard } from '@/data/gameData';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';

interface Props { onBack: () => void; }

export const FlashcardsGame = ({ onBack }: Props) => {
  const [level, setLevel] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [aiCards, setAiCards] = useState<FlashCard[]>([]);
  const ai = useAIGameQuestions<FlashCard>('flashcards');

  const cards = aiCards.length > 0 ? aiCards : (level ? flashcards[level] || [] : []);

  const startLevel = async (l: string) => {
    setLevel(l);
    setCurrentIdx(0);
    setKnown(new Set());
    setIsFlipped(false);
    const generated = await ai.generate(l);
    if (generated && generated.length >= 3) {
      setAiCards(generated);
    } else {
      setAiCards([]);
    }
  };

  if (!level) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">🃏 Flashcards</h2>
        <p className="text-muted-foreground mb-6">Daraja tanlang:</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(flashcards).map(l => (
            <Button key={l} variant="outline" size="lg" onClick={() => startLevel(l)} disabled={ai.loading} className="text-lg">
              {ai.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : l}
            </Button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!level) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">🃏 Flashcards</h2>
        <p className="text-muted-foreground mb-6">Daraja tanlang:</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(flashcards).map(l => (
            <Button key={l} variant="outline" size="lg" onClick={() => { setLevel(l); setCurrentIdx(0); setKnown(new Set()); }} className="text-lg">{l}</Button>
          ))}
        </div>
      </motion.div>
    );
  }

  const card = cards[currentIdx];
  if (!card) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">{currentIdx + 1}/{cards.length}</span>
        <span className="text-sm text-muted-foreground">{known.size} bilingan</span>
        <Button variant="ghost" size="sm" onClick={onBack}>Orqaga</Button>
      </div>

      {/* Card */}
      <div className="perspective-1000 mb-6 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
          className="relative h-64 [transform-style:preserve-3d]"
        >
          {/* Front */}
          <div className="absolute inset-0 bg-card border-2 border-border rounded-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
            <p className="text-3xl font-bold mb-2">{card.front}</p>
            <p className="text-xs text-muted-foreground">Teskari yuzini ko'rish uchun bosing</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 bg-primary/5 border-2 border-primary/30 rounded-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-xl font-bold text-primary mb-3">{card.back}</p>
            <p className="text-sm text-muted-foreground italic text-center">"{card.example}"</p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setIsFlipped(false); }} disabled={currentIdx === 0}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setKnown(new Set([...known, currentIdx])); if (currentIdx < cards.length - 1) { setCurrentIdx(i => i + 1); setIsFlipped(false); } }}>
            ✅ Bilaman
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setIsFlipped(false); if (currentIdx < cards.length - 1) setCurrentIdx(i => i + 1); }}>
            ❌ Bilmayman
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={() => { setCurrentIdx(Math.min(cards.length - 1, currentIdx + 1)); setIsFlipped(false); }} disabled={currentIdx >= cards.length - 1}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {known.size === cards.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
          <p className="text-lg font-bold mb-2">🎉 Barcha kartalarni bilasiz!</p>
          <Button variant="outline" onClick={() => { setKnown(new Set()); setCurrentIdx(0); setIsFlipped(false); }}>
            <RotateCcw className="w-4 h-4 mr-2" /> Qayta boshlash
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
