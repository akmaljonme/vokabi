import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChallengeQuestion } from "@/lib/friendChallenge";

interface ChallengeRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  questions: ChallengeQuestion[];
  challenger_score: number | null;
  opponent_score: number | null;
}

interface Props {
  challenge: ChallengeRow;
  onClose: () => void;
  onDone?: () => void;
}

export const ChallengeQuizModal = ({ challenge, onClose, onDone }: Props) => {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const questions = challenge.questions;
  const isChallenger = user?.id === challenge.challenger_id;
  const q = questions[index];

  const handleAnswer = (optIndex: number) => {
    if (selected !== null) return;
    setSelected(optIndex);
    const correct = optIndex === q.correct;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 700);
  };

  const submitScore = async () => {
    setSubmitting(true);
    try {
      const field = isChallenger ? "challenger_score" : "opponent_score";
      const completedField = isChallenger ? "challenger_completed_at" : "opponent_completed_at";
      const { data: updated, error } = await supabase
        .from("friend_challenges")
        .update({ [field]: score, [completedField]: new Date().toISOString() })
        .eq("id", challenge.id)
        .select()
        .single();
      if (error) throw error;

      // Agar ikkalasi ham yakunlagan bo'lsa — g'olibni belgilaymiz
      const cScore = isChallenger ? score : updated.challenger_score;
      const oScore = isChallenger ? updated.opponent_score : score;
      if (cScore !== null && oScore !== null) {
        const winnerId =
          cScore === oScore ? null : cScore > oScore ? challenge.challenger_id : challenge.opponent_id;
        await supabase
          .from("friend_challenges")
          .update({ status: "completed", winner_id: winnerId })
          .eq("id", challenge.id);
      }

      toast.success(`Test tugadi! ${score}/${questions.length} to'g'ri javob`);
      onDone?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Natijani saqlashda xato yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 z-[70] backdrop-blur-md"
      />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-3 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="w-full max-w-md pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6">
            {!finished && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {!finished ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Savol {index + 1} / {questions.length}
                  </span>
                  <span className="text-xs font-bold text-primary">{score} to'g'ri</span>
                </div>
                <Progress value={((index + (selected !== null ? 1 : 0)) / questions.length) * 100} className="h-1.5 mb-5" />

                <h3 className="text-base font-semibold mb-5 leading-relaxed">{q.question}</h3>

                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const isCorrect = i === q.correct;
                    const isSelected = i === selected;
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={selected !== null}
                        className={`w-full text-left p-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between gap-2 ${
                          selected === null
                            ? "border-border/60 hover:bg-muted/60"
                            : isCorrect
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                              : isSelected
                                ? "border-red-500/50 bg-red-500/10 text-red-600"
                                : "border-border/60 opacity-50"
                        }`}
                      >
                        {opt}
                        {selected !== null && isCorrect && <CheckCircle className="w-4 h-4 shrink-0" />}
                        {selected !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">{score >= questions.length * 0.7 ? "🎉" : "💪"}</div>
                <h3 className="text-xl font-display font-black mb-1">
                  {score} / {questions.length} to'g'ri
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Natijangiz saqlanadi. Do'stingiz ham tugatgach, g'olib aniqlanadi!
                </p>
                <Button className="w-full" onClick={submitScore} disabled={submitting}>
                  {submitting ? "Saqlanmoqda..." : "Natijani saqlash"}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
