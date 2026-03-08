import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Volume2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';

interface Props { onBack: () => void; }

interface ListeningQ {
  text: string;
  question: string;
  options: string[];
  correct: number;
}

const fallbackQuestions: Record<string, ListeningQ[]> = {
  A1: [
    { text: 'Hello, my name is Sarah. I am from London. I like reading books and playing tennis.', question: "Sarah nimani yoqtiradi?", options: ["Futbol o'ynash", "Kitob o'qish va tennis", "Suzish", "Rasm chizish"], correct: 1 },
    { text: 'The weather today is sunny. The temperature is 25 degrees. It is a perfect day for a picnic.', question: "Bugungi ob-havo qanday?", options: ["Yomg'irli", "Quyoshli", "Qorli", "Bulutli"], correct: 1 },
    { text: 'I wake up at 7 o\'clock every morning. I have breakfast and then go to school by bus.', question: "U qancha vaqtda turadi?", options: ["6 da", "7 da", "8 da", "9 da"], correct: 1 },
    { text: 'My favorite food is pizza. I eat pizza every Friday with my family at an Italian restaurant.', question: "U qachon pitsa yeydi?", options: ["Dushanbada", "Chorshanba", "Juma", "Yakshanba"], correct: 2 },
    { text: 'There are five people in my family. My mother, father, two sisters and me.', question: "Oilada nechta kishi bor?", options: ["3 ta", "4 ta", "5 ta", "6 ta"], correct: 2 },
  ],
  B1: [
    { text: 'The conference will be held on March 15th at the Grand Hotel. Registration starts at 9 AM.', question: "Konferensiya qayerda bo'ladi?", options: ["Universitetda", "Grand Hotelda", "Kutubxonada", "Parkda"], correct: 1 },
    { text: 'According to a recent study, people who exercise regularly are 40 percent less likely to develop heart disease.', question: "Mashq qiluvchilar yurak kasalligi xavfi qanchaga kamayadi?", options: ["20%", "40%", "60%", "80%"], correct: 1 },
  ],
};

export const ListeningQuizGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<ListeningQ[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const ai = useAIGameQuestions<ListeningQ>('listening_quiz');

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startGame = async (lvl: string) => {
    setLevel(lvl);
    const aiQ = await ai.generate(lvl);
    let q: ListeningQ[];
    if (aiQ && aiQ.length >= 3) {
      q = aiQ.slice(0, 5);
    } else {
      q = [...(fallbackQuestions[lvl] || fallbackQuestions.A1)].sort(() => Math.random() - 0.5).slice(0, 5);
    }
    setQuizQuestions(q);
    setRound(0);
    setScore(0);
    setSelectedAnswer(null);
    setChecked(false);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setChecked(true);
    if (selectedAnswer === quizQuestions[round].correct) {
      setScore(s => s + 20);
    }
  };

  const handleNext = () => {
    const next = round + 1;
    if (next >= quizQuestions.length) {
      if (user) {
        supabase.from('game_scores').insert({ user_id: user.id, game_type: 'listening_quiz', score, level: level || 'A1' });
      }
      toast({ title: `O'yin tugadi! Ball: ${score}` });
      setLevel(null);
    } else {
      setRound(next);
      setSelectedAnswer(null);
      setChecked(false);
    }
  };

  if (!level) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎧</div>
          <h2 className="text-2xl font-display font-bold mb-2">Listening Quiz</h2>
          <p className="text-muted-foreground">Eshiting va savolga javob bering!</p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {Object.keys(fallbackQuestions).map(lvl => (
            <Button key={lvl} variant="outline" className="h-16 text-lg font-bold" onClick={() => startGame(lvl)}>{lvl}</Button>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  const q = quizQuestions[round];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => { window.speechSynthesis.cancel(); setLevel(null); }}>← Orqaga</Button>
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Ball: <strong className="text-foreground">{score}</strong></span>
          <span className="text-muted-foreground">Raund: <strong className="text-foreground">{round + 1}/{quizQuestions.length}</strong></span>
        </div>
      </div>

      <div className="card-elevated p-6">
        {/* Play button */}
        <div className="text-center mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => speak(q.text)}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors ${
              speaking ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            <Volume2 className="w-8 h-8" />
          </motion.button>
          <p className="text-sm text-muted-foreground mt-3">
            {speaking ? 'Tinglayapsiz...' : 'Tinglash uchun bosing'}
          </p>
        </div>

        {/* Question */}
        <h3 className="font-bold text-center mb-4">{q.question}</h3>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {q.options.map((opt, i) => (
            <motion.button
              key={i}
              whileHover={!checked ? { scale: 1.01 } : {}}
              onClick={() => !checked && setSelectedAnswer(i)}
              disabled={checked}
              className={`w-full p-3 rounded-xl text-left text-sm font-medium border transition-all ${
                checked
                  ? i === q.correct
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600'
                    : i === selectedAnswer
                      ? 'bg-destructive/20 border-destructive text-destructive'
                      : 'border-border opacity-50'
                  : selectedAnswer === i
                    ? 'bg-primary/10 border-primary'
                    : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
              {opt}
              {checked && i === q.correct && <CheckCircle className="w-4 h-4 inline ml-2 text-emerald-500" />}
              {checked && i === selectedAnswer && i !== q.correct && <XCircle className="w-4 h-4 inline ml-2 text-destructive" />}
            </motion.button>
          ))}
        </div>

        <div className="text-center">
          {checked ? (
            <Button onClick={handleNext}>{round >= quizQuestions.length - 1 ? "Natija" : "Keyingi →"}</Button>
          ) : (
            <Button onClick={checkAnswer} disabled={selectedAnswer === null}>Tekshirish</Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
