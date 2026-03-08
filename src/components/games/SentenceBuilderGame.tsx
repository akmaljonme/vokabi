import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';

interface Props { onBack: () => void; }

interface Sentence {
  words: string[];
  correct: string;
  translation: string;
}

const fallbackSentences: Record<string, Sentence[]> = {
  A1: [
    { words: ['I', 'am', 'a', 'student'], correct: 'I am a student', translation: "Men talabaman" },
    { words: ['She', 'likes', 'reading', 'books'], correct: 'She likes reading books', translation: "U kitob o'qishni yaxshi ko'radi" },
    { words: ['We', 'go', 'to', 'school', 'every', 'day'], correct: 'We go to school every day', translation: "Biz har kuni maktabga boramiz" },
    { words: ['My', 'name', 'is', 'Ali'], correct: 'My name is Ali', translation: "Mening ismim Ali" },
    { words: ['The', 'cat', 'is', 'on', 'the', 'table'], correct: 'The cat is on the table', translation: "Mushuk stol ustida" },
  ],
  B1: [
    { words: ['If', 'I', 'had', 'money', 'I', 'would', 'travel'], correct: 'If I had money I would travel', translation: "Agar pulim bo'lganida sayohat qilardim" },
    { words: ['The', 'book', 'which', 'I', 'read', 'was', 'interesting'], correct: 'The book which I read was interesting', translation: "Men o'qigan kitob qiziqarli edi" },
    { words: ['She', 'has', 'been', 'studying', 'English', 'for', 'three', 'years'], correct: 'She has been studying English for three years', translation: "U uch yildan beri ingliz tili o'qiyapti" },
    { words: ['The', 'more', 'you', 'practice', 'the', 'better', 'you', 'get'], correct: 'The more you practice the better you get', translation: "Qancha ko'p mashq qilsangiz shuncha yaxshi bo'ladi" },
  ],
};

export const SentenceBuilderGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const ai = useAIGameQuestions<Sentence>('sentence_builder');

  const startGame = async (lvl: string) => {
    setLevel(lvl);
    const aiSentences = await ai.generate(lvl);
    let s: Sentence[];
    if (aiSentences && aiSentences.length >= 3) {
      s = aiSentences.slice(0, 5);
    } else {
      s = [...(fallbackSentences[lvl] || fallbackSentences.A1)].sort(() => Math.random() - 0.5).slice(0, 5);
    }
    setSentences(s);
    setRound(0);
    setScore(0);
    loadRound(s[0]);
  };

  const loadRound = (sentence: Sentence) => {
    setShuffled([...sentence.words].sort(() => Math.random() - 0.5));
    setSelected([]);
    setChecked(false);
    setIsCorrect(false);
  };

  const handleWordClick = (word: string, fromSelected: boolean) => {
    if (checked) return;
    if (fromSelected) {
      const idx = selected.indexOf(word);
      const newSelected = [...selected];
      newSelected.splice(idx, 1);
      setSelected(newSelected);
      setShuffled(prev => [...prev, word]);
    } else {
      const idx = shuffled.indexOf(word);
      const newShuffled = [...shuffled];
      newShuffled.splice(idx, 1);
      setShuffled(newShuffled);
      setSelected(prev => [...prev, word]);
    }
  };

  const checkAnswer = () => {
    const userSentence = selected.join(' ');
    const correct = userSentence === sentences[round].correct;
    setIsCorrect(correct);
    setChecked(true);
    if (correct) setScore(s => s + 20);
  };

  const handleNext = () => {
    const next = round + 1;
    if (next >= sentences.length) {
      if (user) {
        supabase.from('game_scores').insert({ user_id: user.id, game_type: 'sentence_builder', score, level: level || 'A1' });
      }
      toast({ title: `O'yin tugadi! Ball: ${score}` });
      setLevel(null);
    } else {
      setRound(next);
      loadRound(sentences[next]);
    }
  };

  if (!level) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-2xl font-display font-bold mb-2">Sentence Builder</h2>
          <p className="text-muted-foreground">So'zlarni to'g'ri tartibga qo'yib gap yasang!</p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {Object.keys(sentencesByLevel).map(lvl => (
            <Button key={lvl} variant="outline" className="h-16 text-lg font-bold" onClick={() => startGame(lvl)}>{lvl}</Button>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  const sentence = sentences[round];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLevel(null)}>← Orqaga</Button>
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Ball: <strong className="text-foreground">{score}</strong></span>
          <span className="text-muted-foreground">Raund: <strong className="text-foreground">{round + 1}/{sentences.length}</strong></span>
        </div>
      </div>

      <div className="card-elevated p-6">
        <p className="text-sm text-muted-foreground text-center mb-1">🇺🇿 Tarjimasi:</p>
        <p className="text-center font-medium mb-6">{sentence.translation}</p>

        {/* Selected words (answer area) */}
        <div className="min-h-[52px] border-2 border-dashed border-primary/30 rounded-xl p-3 mb-4 flex flex-wrap gap-2">
          {selected.length === 0 && <span className="text-xs text-muted-foreground">So'zlarni bu yerga qo'ying...</span>}
          {selected.map((word, i) => (
            <motion.button
              key={`s-${i}`}
              layout
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={() => handleWordClick(word, true)}
              disabled={checked}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                checked
                  ? isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600' : 'bg-destructive/20 border-destructive text-destructive'
                  : 'bg-primary/10 border-primary/30 hover:bg-primary/20'
              }`}
            >
              {word}
            </motion.button>
          ))}
        </div>

        {/* Available words */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {shuffled.map((word, i) => (
            <motion.button
              key={`a-${i}`}
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleWordClick(word, false)}
              disabled={checked}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 border border-border transition-colors"
            >
              {word}
            </motion.button>
          ))}
        </div>

        {/* Check / Result */}
        {checked ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            {isCorrect ? (
              <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold mb-3">
                <CheckCircle className="w-5 h-5" /> To'g'ri! +20 ball
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex items-center justify-center gap-2 text-destructive font-bold mb-1">
                  <XCircle className="w-5 h-5" /> Noto'g'ri
                </div>
                <p className="text-sm text-muted-foreground">To'g'ri javob: <strong>{sentence.correct}</strong></p>
              </div>
            )}
            <Button onClick={handleNext}>{round >= sentences.length - 1 ? "Natija" : "Keyingi →"}</Button>
          </motion.div>
        ) : (
          <div className="text-center">
            <Button onClick={checkAnswer} disabled={selected.length === 0}>Tekshirish</Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
