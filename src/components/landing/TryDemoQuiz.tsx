import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2, XCircle, Rocket, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DemoQuestion {
  word: string;
  question: string;
  options: string[];
  correctIndex: number;
}

// Kichik, mustaqil demo — hech qanday login yoki bazaga ulanish talab qilmaydi.
// Maqsad: "sovuq" tashrifchiga ro'yxatdan o'tishdan oldin haqiqiy qiymatni tatib ko'rsatish.
const DEMO_QUESTIONS: DemoQuestion[] = [
  { word: "Achieve", question: "\"Achieve\" so'zining ma'nosi qaysi?", options: ["Erishmoq", "Unutmoq", "Yo'qotmoq", "Kutmoq"], correctIndex: 0 },
  { word: "Reluctant", question: "\"Reluctant\" so'zining ma'nosi qaysi?", options: ["Xursand", "Istamaydigan", "Tez", "Ishonchli"], correctIndex: 1 },
  { word: "Enhance", question: "\"Enhance\" so'zining ma'nosi qaysi?", options: ["Kamaytirmoq", "Buzmoq", "Yaxshilamoq", "Yashirmoq"], correctIndex: 2 },
  { word: "Consequence", question: "\"Consequence\" so'zining ma'nosi qaysi?", options: ["Oqibat", "Savol", "Boshlanish", "Sabab"], correctIndex: 0 },
  { word: "Diligent", question: "\"Diligent\" so'zining ma'nosi qaysi?", options: ["Dangasa", "Mehnatkash", "Aqlli", "Boy"], correctIndex: 1 },
];

interface TryDemoQuizProps {
  open: boolean;
  onClose: () => void;
}

export const TryDemoQuiz = ({ open, onClose }: TryDemoQuizProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const reset = () => {
    setStep(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    if (index === DEMO_QUESTIONS[step].correctIndex) {
      setScore((s) => s + 1);
    }
    setTimeout(() => {
      if (step + 1 < DEMO_QUESTIONS.length) {
        setStep((s) => s + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 700);
  };

  if (!open) return null;

  const q = DEMO_QUESTIONS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-3xl border border-border/60 p-6 sm:p-8 max-w-md w-full relative"
        >
          <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>

          {!finished ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Bepul sinov • Ro'yxatdan o'tmasdan</span>
                <span className="text-xs text-muted-foreground font-semibold">{step + 1}/{DEMO_QUESTIONS.length}</span>
              </div>

              <div className="h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${((step + (selected !== null ? 1 : 0)) / DEMO_QUESTIONS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <h3 className="font-display font-black text-lg sm:text-xl mb-6">{q.question}</h3>

              <div className="space-y-2.5">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isSelected = i === selected;
                  let stateClass = "border-border/60 hover:border-primary/50 hover:bg-muted/40";
                  if (selected !== null) {
                    if (isCorrect) stateClass = "border-emerald-500 bg-emerald-500/10";
                    else if (isSelected) stateClass = "border-red-500 bg-red-500/10";
                    else stateClass = "border-border/40 opacity-50";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={selected !== null}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 font-medium text-sm transition-colors flex items-center justify-between ${stateClass}`}
                    >
                      {opt}
                      {selected !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-black text-xl mb-1">
                {score}/{DEMO_QUESTIONS.length} to'g'ri!
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Bu — Vokabi'dagi minglab so'z va mashqlarning kichik bir qismi. Ro'yxatdan o'ting va natijalaringizni saqlab, o'z darajangizni kuzatib boring.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Ro'yxatdan o'tib davom etish <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={reset}
                  className="w-full py-3 rounded-2xl font-medium text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Qayta urinib ko'rish
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
