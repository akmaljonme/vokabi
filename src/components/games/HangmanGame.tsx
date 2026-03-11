import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';
import { Loader2 } from 'lucide-react';

interface Props { onBack: () => void; }

const wordsByLevel: Record<string, { word: string; hint: string }[]> = {
  A1: [
    { word: 'APPLE', hint: 'Meva' }, { word: 'SCHOOL', hint: "O'qish joyi" },
    { word: 'WATER', hint: 'Ichimlik' }, { word: 'HOUSE', hint: 'Yashash joyi' },
    { word: 'HAPPY', hint: 'Kayfiyat' }, { word: 'BREAD', hint: 'Oziq-ovqat' },
    { word: 'GREEN', hint: 'Rang' }, { word: 'CHAIR', hint: 'Mebel' },
  ],
  A2: [
    { word: 'MARKET', hint: 'Bozor' }, { word: 'TRAVEL', hint: 'Sayohat' },
    { word: 'GARDEN', hint: "Bog'" }, { word: 'BRIDGE', hint: "Ko'prik" },
    { word: 'FRIEND', hint: "Do'st" }, { word: 'ISLAND', hint: 'Orol' },
    { word: 'WINTER', hint: 'Fasl' }, { word: 'JUNGLE', hint: "O'rmon" },
  ],
  B1: [
    { word: 'KNOWLEDGE', hint: 'Bilim' }, { word: 'BEAUTIFUL', hint: "Go'zal" },
    { word: 'CHALLENGE', hint: 'Qiyinchilik' }, { word: 'EDUCATION', hint: "Ta'lim" },
    { word: 'ADVENTURE', hint: 'Sarguzasht' }, { word: 'DIFFERENT', hint: 'Boshqacha' },
    { word: 'IMPORTANT', hint: 'Muhim' }, { word: 'DANGEROUS', hint: 'Xavfli' },
  ],
  B2: [
    { word: 'PHILOSOPHY', hint: 'Falsafa' }, { word: 'ACCOMPLISH', hint: 'Erishmoq' },
    { word: 'ENTHUSIASM', hint: 'Ishtiyoq' }, { word: 'PHENOMENON', hint: 'Hodisa' },
    { word: 'INEVITABLE', hint: 'Muqarrar' }, { word: 'CONSCIENCE', hint: 'Vijdon' },
  ],
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_WRONG = 6;

const HangmanDrawing = ({ wrongCount }: { wrongCount: number }) => (
  <svg width="120" height="140" viewBox="0 0 120 140" className="mx-auto">
    {/* Base */}
    <line x1="10" y1="135" x2="110" y2="135" className="stroke-muted-foreground" strokeWidth="3" />
    <line x1="30" y1="135" x2="30" y2="10" className="stroke-muted-foreground" strokeWidth="3" />
    <line x1="30" y1="10" x2="80" y2="10" className="stroke-muted-foreground" strokeWidth="3" />
    <line x1="80" y1="10" x2="80" y2="25" className="stroke-muted-foreground" strokeWidth="3" />
    {/* Head */}
    {wrongCount >= 1 && <circle cx="80" cy="38" r="13" className="stroke-destructive" strokeWidth="2.5" fill="none" />}
    {/* Body */}
    {wrongCount >= 2 && <line x1="80" y1="51" x2="80" y2="85" className="stroke-destructive" strokeWidth="2.5" />}
    {/* Left arm */}
    {wrongCount >= 3 && <line x1="80" y1="60" x2="60" y2="75" className="stroke-destructive" strokeWidth="2.5" />}
    {/* Right arm */}
    {wrongCount >= 4 && <line x1="80" y1="60" x2="100" y2="75" className="stroke-destructive" strokeWidth="2.5" />}
    {/* Left leg */}
    {wrongCount >= 5 && <line x1="80" y1="85" x2="60" y2="110" className="stroke-destructive" strokeWidth="2.5" />}
    {/* Right leg */}
    {wrongCount >= 6 && <line x1="80" y1="85" x2="100" y2="110" className="stroke-destructive" strokeWidth="2.5" />}
  </svg>
);

export const HangmanGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [aiWordList, setAiWordList] = useState<{ word: string; hint: string }[]>([]);
  const ai = useAIGameQuestions<{ word: string; hint: string }>('hangman');

  const startGame = async (lvl: string) => {
    setLevel(lvl);
    setScore(0);
    setRound(0);
    const aiWords = await ai.generate(lvl);
    if (aiWords && aiWords.length >= 4) {
      setAiWordList(aiWords);
      nextWordFromList(aiWords, 0);
    } else {
      setAiWordList([]);
      nextWord(lvl, 0);
    }
  };

  const nextWordFromList = (list: { word: string; hint: string }[], currentRound: number) => {
    if (currentRound >= list.length) { setGameOver(true); return; }
    const item = list[currentRound];
    setWord(item.word.toUpperCase());
    setHint(item.hint);
    setGuessed([]); setWrongCount(0); setWon(false); setGameOver(false);
  };

  const nextWord = (lvl: string, currentRound: number) => {
    const words = wordsByLevel[lvl] || wordsByLevel.A1;
    const w = words[currentRound % words.length];
    setWord(w.word);
    setHint(w.hint);
    setGuessed([]);
    setWrongCount(0);
    setGameOver(false);
    setWon(false);
  };

  const handleGuess = useCallback((letter: string) => {
    if (guessed.includes(letter) || gameOver) return;
    const newGuessed = [...guessed, letter];
    setGuessed(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= MAX_WRONG) {
        setGameOver(true);
        setWon(false);
      }
    } else {
      const allRevealed = word.split('').every(l => newGuessed.includes(l));
      if (allRevealed) {
        const earned = (MAX_WRONG - wrongCount) * 10;
        setScore(s => s + earned);
        setGameOver(true);
        setWon(true);
      }
    }
  }, [guessed, word, wrongCount, gameOver]);

  const handleNext = () => {
    const next = round + 1;
    setRound(next);
    if (next >= 5) {
      // Game finished after 5 rounds
      if (user) {
        supabase.from('game_scores').insert({ user_id: user.id, game_type: 'hangman', score, level: level || 'A1' });
      }
      toast({ title: `O'yin tugadi! Ball: ${score}` });
      setLevel(null);
    } else {
      if (aiWordList.length > 0) {
        nextWordFromList(aiWordList, next);
      } else {
        nextWord(level!, next);
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (ALPHABET.includes(key)) handleGuess(key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGuess]);

  if (!level) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💀</div>
          <h2 className="text-2xl font-display font-bold mb-2">Hangman</h2>
          <p className="text-muted-foreground">Harflarni topib, so'zni aniqlang!</p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {Object.keys(wordsByLevel).map(lvl => (
            <Button key={lvl} variant="outline" className="h-16 text-lg font-bold" onClick={() => startGame(lvl)}>{lvl}</Button>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLevel(null)}>← Orqaga</Button>
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Ball: <strong className="text-foreground">{score}</strong></span>
          <span className="text-muted-foreground">Raund: <strong className="text-foreground">{round + 1}/5</strong></span>
        </div>
      </div>

      <div className="card-elevated p-6 text-center">
        <HangmanDrawing wrongCount={wrongCount} />

        <div className="mt-4 mb-2 text-sm text-muted-foreground">💡 {hint}</div>

        {/* Word display */}
        <div className="flex justify-center gap-2 my-6">
          {word.split('').map((letter, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`w-9 h-11 border-b-2 flex items-center justify-center text-xl font-bold ${
                gameOver && !guessed.includes(letter) ? 'text-destructive border-destructive' : 'border-primary'
              }`}
            >
              {guessed.includes(letter) || gameOver ? letter : ''}
            </motion.div>
          ))}
        </div>

        {/* Game over message */}
        {gameOver && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            {won ? (
              <p className="text-emerald-500 font-bold text-lg">🎉 To'g'ri topdingiz!</p>
            ) : (
              <p className="text-destructive font-bold text-lg">😔 So'z: {word}</p>
            )}
            <Button className="mt-3" onClick={handleNext}>
              {round >= 4 ? 'Natijani ko\'rish' : 'Keyingi so\'z →'}
            </Button>
          </motion.div>
        )}

        {/* Keyboard */}
        {!gameOver && (
          <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mx-auto">
            {ALPHABET.map(letter => (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={guessed.includes(letter)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  guessed.includes(letter)
                    ? word.includes(letter) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/20 text-destructive opacity-50'
                    : 'bg-muted hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {/* Wrong count */}
        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: MAX_WRONG }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < wrongCount ? 'bg-destructive' : 'bg-muted'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
