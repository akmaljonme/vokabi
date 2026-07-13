import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, XCircle, BookOpen, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GrammarTopic } from "@/lib/grammarTopics";
import { generateGrammarLesson, GrammarLesson } from "@/lib/grammarLesson";

interface Props {
  topic: GrammarTopic;
  onClose: () => void;
  onCompleted?: (score: number, total: number) => void;
}

type Stage = "loading" | "learn" | "quiz" | "result" | "error";

export const GrammarLessonModal = ({ topic, onClose, onCompleted }: Props) => {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("loading");
  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setStage("loading");
    const result = await generateGrammarLesson(topic.title, topic.level);
    if (!result) {
      setStage("error");
      return;
    }
    setLesson(result);
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setStage("learn");
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.key]);

  const answer = (optIndex: number) => {
    if (selected !== null || !lesson) return;
    setSelected(optIndex);
    const q = lesson.questions[qIndex];
    const correct = optIndex === q.correct;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (qIndex + 1 < lesson.questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
      } else {
        finish(correct ? score + 1 : score);
      }
    }, 700);
  };

  const finish = async (finalScore: number) => {
    setStage("result");
    if (!user || !lesson) return;
    setSaving(true);
    try {
      await supabase.from("grammar_progress").upsert(
        {
          user_id: user.id,
          topic_key: topic.key,
          score: finalScore,
          total: lesson.questions.length,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic_key" },
      );
      onCompleted?.(finalScore, lesson.questions.length);
    } catch (err) {
      console.error(err);
      toast.error("Natija saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  const q = lesson?.questions[qIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 z-[80] backdrop-blur-md"
        onClick={stage !== "quiz" ? onClose : undefined}
      />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-3 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md max-h-[85vh] overflow-y-auto pointer-events-auto rounded-3xl border border-border/60 bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">{topic.level}</p>
              <h3 className="text-lg font-display font-bold">{topic.title}</h3>
            </div>
            {stage !== "quiz" && (
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {stage === "loading" && (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Dars tayyorlanmoqda...</p>
            </div>
          )}

          {stage === "error" && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">Darsni tuzib bo'lmadi, birozdan so'ng qayta urinib ko'ring</p>
              <Button onClick={load} variant="outline" size="sm">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Qayta urinish
              </Button>
            </div>
          )}

          {stage === "learn" && lesson && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Qoida
                </p>
                <p className="text-sm leading-relaxed">{lesson.explanation}</p>
              </div>
              {lesson.examples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Misollar</p>
                  <div className="space-y-1.5">
                    {lesson.examples.map((ex, i) => (
                      <p key={i} className="text-sm p-2.5 rounded-xl bg-muted/50">{ex}</p>
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={() => setStage("quiz")}>
                <Sparkles className="w-4 h-4 mr-2" /> Mashqni boshlash ({lesson.questions.length} savol)
              </Button>
            </div>
          )}

          {stage === "quiz" && q && lesson && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Savol {qIndex + 1} / {lesson.questions.length}
                </span>
                <span className="text-xs font-bold text-primary">{score} to'g'ri</span>
              </div>
              <Progress value={(qIndex / lesson.questions.length) * 100} className="h-1.5 mb-5" />
              <h4 className="text-base font-semibold mb-4 leading-relaxed">{q.question}</h4>
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correct;
                  const isSelected = i === selected;
                  return (
                    <button
                      key={i}
                      onClick={() => answer(i)}
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
            </div>
          )}

          {stage === "result" && lesson && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">{score >= lesson.questions.length * 0.7 ? "🎉" : "💪"}</div>
              <h3 className="text-xl font-display font-black mb-1">
                {score} / {lesson.questions.length} to'g'ri
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {score >= lesson.questions.length * 0.7
                  ? "Ajoyib! Bu mavzuni yaxshi o'zlashtirdingiz."
                  : "Qoidani qayta ko'rib chiqib, yana mashq qiling."}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStage("learn")}>
                  Qoidani qaytadan ko'rish
                </Button>
                <Button className="flex-1" onClick={onClose} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tugatish"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
