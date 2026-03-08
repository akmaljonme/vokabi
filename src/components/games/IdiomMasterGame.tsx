import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface Props { onBack: () => void; }

interface Idiom {
  idiom: string;
  meaning: string;
  meaningUz: string;
  options: string[];
  correct: number;
  example: string;
}

const idioms: Idiom[] = [
  { idiom: 'Break the ice', meaning: 'Start a conversation in a social situation', meaningUz: "Suhbatni boshlash", options: ["Muzni sindirish", "Suhbatni boshlash", "Muzroq ichimlik", "Sovuq ob-havo"], correct: 1, example: "He told a joke to break the ice at the meeting." },
  { idiom: 'Piece of cake', meaning: 'Something very easy', meaningUz: "Juda oson narsa", options: ["Mazali tort", "Juda oson narsa", "Kichik bo'lak", "Tug'ilgan kun"], correct: 1, example: "The exam was a piece of cake!" },
  { idiom: 'Hit the nail on the head', meaning: 'Describe exactly what is causing a problem', meaningUz: "Muammoni aniq aniqlash", options: ["Qurilish qilish", "Muammoni aniq aniqlash", "Juda qattiq urish", "Noto'g'ri qilish"], correct: 1, example: "You hit the nail on the head with that analysis." },
  { idiom: 'Under the weather', meaning: 'Feeling ill or sick', meaningUz: "Kasal his qilmoq", options: ["Yomg'irda yurish", "Kasal his qilmoq", "Ob-havo yomon", "Sovuqda qolish"], correct: 1, example: "I'm feeling a bit under the weather today." },
  { idiom: 'Cost an arm and a leg', meaning: 'Very expensive', meaningUz: "Juda qimmat", options: ["Jarohatlangan", "Jismoniy og'riq", "Juda qimmat", "Arzon narsa"], correct: 2, example: "That new car cost an arm and a leg." },
  { idiom: 'Let the cat out of the bag', meaning: 'Reveal a secret', meaningUz: "Sirni oshkor qilmoq", options: ["Mushukni qo'yib yuborish", "Sirni oshkor qilmoq", "Xarid qilish", "Hayvon asrash"], correct: 1, example: "She let the cat out of the bag about the surprise party." },
  { idiom: 'Once in a blue moon', meaning: 'Very rarely', meaningUz: "Juda kamdan-kam", options: ["Har oy", "Juda kamdan-kam", "Tunda", "Ko'k rangda"], correct: 1, example: "He visits us once in a blue moon." },
  { idiom: 'Burn the midnight oil', meaning: 'Work late into the night', meaningUz: "Kechasi ishlash", options: ["Yong'in chiqarish", "Kechasi ishlash", "Moy ishlatish", "Erta turish"], correct: 1, example: "She burned the midnight oil to finish the project." },
  { idiom: 'Bite the bullet', meaning: 'Face a difficult situation bravely', meaningUz: "Qiyinchilikka jasurona duch kelmoq", options: ["Tishni qisish", "Qiyinchilikka jasurona duch kelmoq", "Ovqatlanish", "Kurash qilish"], correct: 1, example: "I decided to bite the bullet and ask for a raise." },
  { idiom: 'Spill the beans', meaning: 'Reveal secret information', meaningUz: "Sirni aytib qo'ymoq", options: ["Ovqat to'kish", "Sirni aytib qo'ymoq", "Loviya ekish", "Aybni bo'yniga olish"], correct: 1, example: "Come on, spill the beans! What happened?" },
  { idiom: 'The ball is in your court', meaning: "It's your decision/turn", meaningUz: "Navbat sizda", options: ["Sport o'yini", "Navbat sizda", "To'p o'ynash", "Sud jarayoni"], correct: 1, example: "I've done my part. The ball is in your court now." },
  { idiom: 'Kill two birds with one stone', meaning: 'Accomplish two things at once', meaningUz: "Bir tosh bilan ikki qushni urish", options: ["Qushlarni ovlash", "Bir tosh bilan ikki qushni urish", "Ikki marta urinish", "Tosh otish"], correct: 1, example: "By cycling to work, I kill two birds with one stone — exercise and commuting." },
];

export const IdiomMasterGame = ({ onBack }: Props) => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gameIdioms, setGameIdioms] = useState<Idiom[]>([]);

  const startGame = () => {
    const shuffled = [...idioms].sort(() => Math.random() - 0.5).slice(0, 8);
    setGameIdioms(shuffled);
    setStarted(true);
    setRound(0);
    setScore(0);
    setSelectedAnswer(null);
    setChecked(false);
    setShowHint(false);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setChecked(true);
    if (selectedAnswer === gameIdioms[round].correct) {
      setScore(s => s + (showHint ? 10 : 20));
    }
  };

  const handleNext = () => {
    const next = round + 1;
    if (next >= gameIdioms.length) {
      if (user) {
        supabase.from('game_scores').insert({ user_id: user.id, game_type: 'idiom_master', score, level: 'B1' });
      }
      toast({ title: `O'yin tugadi! Ball: ${score}` });
      setStarted(false);
    } else {
      setRound(next);
      setSelectedAnswer(null);
      setChecked(false);
      setShowHint(false);
    }
  };

  if (!started) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎭</div>
          <h2 className="text-2xl font-display font-bold mb-2">Idiom Master</h2>
          <p className="text-muted-foreground">Ingliz tili iboralarining ma'nosini toping!</p>
        </div>
        <div className="max-w-md mx-auto text-center">
          <Button className="h-16 px-8 text-lg" onClick={startGame}>🎮 O'yinni boshlash</Button>
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={onBack}>← Orqaga</Button>
        </div>
      </motion.div>
    );
  }

  const q = gameIdioms[round];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => setStarted(false)}>← Orqaga</Button>
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Ball: <strong className="text-foreground">{score}</strong></span>
          <span className="text-muted-foreground">{round + 1}/{gameIdioms.length}</span>
        </div>
      </div>

      <div className="card-elevated p-6">
        {/* Idiom */}
        <motion.div
          key={round}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-center text-xs text-muted-foreground mb-2 uppercase tracking-wider">Idiom</p>
          <h3 className="text-2xl font-display font-bold text-center text-primary mb-1">"{q.idiom}"</h3>
          
          {!showHint && !checked && (
            <button onClick={() => setShowHint(true)} className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors">
              <Lightbulb className="w-3 h-3" /> Misol ko'rish (-10 ball)
            </button>
          )}
          {showHint && (
            <p className="text-center text-xs text-muted-foreground mt-2 italic">"{q.example}"</p>
          )}
        </motion.div>

        <p className="text-center text-sm text-muted-foreground my-5">Bu ibora nimani anglatadi?</p>

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
              {opt}
              {checked && i === q.correct && <CheckCircle className="w-4 h-4 inline ml-2" />}
              {checked && i === selectedAnswer && i !== q.correct && <XCircle className="w-4 h-4 inline ml-2" />}
            </motion.button>
          ))}
        </div>

        {/* Feedback */}
        {checked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-lg bg-muted text-sm">
            <p className="font-medium mb-1">📖 {q.meaning}</p>
            <p className="text-muted-foreground italic">"{q.example}"</p>
          </motion.div>
        )}

        <div className="text-center">
          {checked ? (
            <Button onClick={handleNext}>{round >= gameIdioms.length - 1 ? "Natija" : "Keyingi →"}</Button>
          ) : (
            <Button onClick={checkAnswer} disabled={selectedAnswer === null}>Tekshirish</Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
