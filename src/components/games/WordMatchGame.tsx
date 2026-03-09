import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { wordPairs } from '@/data/gameData';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';
import { Loader2 } from 'lucide-react';

interface Props { onBack: () => void; }

export const WordMatchGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | null>(null);
  const [cards, setCards] = useState<{ id: number; text: string; pairId: number; matched: boolean; selected: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const ai = useAIGameQuestions<{ en: string; uz: string }>('word_match');

  useEffect(() => {
    if (!level || gameOver) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [level, gameOver]);

  const buildCards = (pairs: { en: string; uz: string }[]) => {
    const allCards = pairs.slice(0, 6).flatMap((p, i) => [
      { id: i * 2, text: p.en, pairId: i, matched: false, selected: false },
      { id: i * 2 + 1, text: p.uz, pairId: i, matched: false, selected: false },
    ]);
    setCards(allCards.sort(() => Math.random() - 0.5));
    setMatches(0); setMoves(0); setTimer(0); setGameOver(false); setSelected([]);
  };

  const startGame = async (lvl: string) => {
    setLevel(lvl);
    // Try AI first, fallback to static
    const aiPairs = await ai.generate(lvl);
    if (aiPairs && aiPairs.length >= 6) {
      buildCards(aiPairs);
    } else {
      buildCards(wordPairs[lvl]?.slice(0, 6) || []);
    }
  };

  const [wrongPair, setWrongPair] = useState<number[]>([]);

  const handleSelect = useCallback((id: number) => {
    if (selected.length >= 2 || cards.find(c => c.id === id)?.matched || selected.includes(id)) return;
    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newSelected.map(sid => cards.find(c => c.id === sid)!);
      if (a.pairId === b.pairId) {
        setCards(prev => prev.map(c => c.pairId === a.pairId ? { ...c, matched: true } : c));
        setMatches(m => {
          const next = m + 1;
          if (next === 6) {
            setGameOver(true);
            saveScore(next);
          }
          return next;
        });
        setSelected([]);
      } else {
        setWrongPair(newSelected);
        setTimeout(() => { setSelected([]); setWrongPair([]); }, 800);
      }
    }
  }, [selected, cards]);

  const saveScore = async (score: number) => {
    if (!user) return;
    await supabase.from('game_scores').insert({ user_id: user.id, game_type: 'word_match', score, level: level || 'A1' });
    toast({ title: '🎉 Tabriklaymiz!', description: `${moves} urinishda topildingiz! +${score * 10} XP` });
  };

  if (!level) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">🔗 Word Match</h2>
        <p className="text-muted-foreground mb-6">Daraja tanlang:</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(wordPairs).map(l => (
            <Button key={l} variant="outline" size="lg" onClick={() => startGame(l)} className="text-lg">{l}</Button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 text-sm">
          <span>⏱ {timer}s</span>
          <span>🎯 {matches}/6</span>
          <span>👆 {moves} moves</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>Orqaga</Button>
      </div>

      {gameOver ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold mb-2">Ajoyib!</h3>
          <p className="text-muted-foreground mb-6">{moves} urinishda, {timer} sekundda</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => startGame(level)}>Qayta o'ynash</Button>
            <Button variant="outline" onClick={onBack}>Boshqa o'yin</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {cards.map(card => (
            <motion.button
              key={card.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(card.id)}
              className={`p-4 rounded-xl border-2 text-sm font-medium transition-all min-h-[64px] ${
                card.matched ? 'bg-primary/10 border-primary text-primary' :
                selected.includes(card.id) ? 'bg-accent border-accent-foreground/30' :
                'bg-card border-border hover:border-primary/30'
              }`}
            >
              {card.text}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
