import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, BookOpen, Trophy, ChevronRight } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";
const supabase: any = _sb;

type Question = {
  question: string;
  options: Record<string, string>;
  correct: string;
  explanation?: string;
};

export default function SharedTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"intro" | "test" | "result">("intro");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data, error } = await supabase.from("shared_tests").select("*").eq("id", id).single();
      if (error || !data) { toast.error("Test topilmadi"); navigate("/"); return; }
      setTest(data);
      await supabase.rpc("increment_test_views", { test_uuid: id });
      setLoading(false);
    };
    fetch();
  }, [id]);

  const questions: Question[] = test?.questions || [];

  const submit = () => {
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) score++; });
    setResult({ score, total: questions.length });
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const pct = result ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>

        <AnimatePresence mode="wait">
          {/* INTRO */}
          {view === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center p-8 rounded-3xl border border-border bg-card mb-6">
                <div className="text-6xl mb-4">📋</div>
                <h1 className="text-2xl font-display font-bold mb-2">{test.title}</h1>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {questions.length} ta savol</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> ~{Math.ceil(questions.length * 1.5)} daqiqa</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs">{test.level}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-8">Do'stingiz sizga bu testni ulashdi. Natijangizni ko'rish uchun barcha savollarga javob bering.</p>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setView("test")}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg"
                >
                  Testni boshlash 🚀
                </motion.button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Ko'rishlar soni: {test.view_count || 0} ta
              </p>
            </motion.div>
          )}

          {/* TEST */}
          {view === "test" && (
            <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{current + 1} / {questions.length}</span>
                  <span>{Object.keys(answers).length} javob berildi</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="p-6 rounded-2xl border border-border bg-card mb-4"
                >
                  <p className="font-semibold text-base mb-5 leading-relaxed">
                    {current + 1}. {questions[current]?.question}
                  </p>
                  <div className="space-y-2">
                    {Object.entries(questions[current]?.options || {}).map(([key, val]) => (
                      <button key={key}
                        onClick={() => setAnswers(prev => ({ ...prev, [current]: key }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          answers[current] === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <span className="font-bold mr-2">{key}.</span>{val as string}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex gap-3">
                {current > 0 && (
                  <button onClick={() => setCurrent(c => c - 1)} className="flex-1 py-3 rounded-xl border border-border hover:bg-muted font-semibold transition-colors">
                    ← Oldingi
                  </button>
                )}
                {current < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrent(c => c + 1)}
                    disabled={!answers[current]}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-40 transition-all"
                  >
                    Keyingi →
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={submit}
                    disabled={Object.keys(answers).length < questions.length}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold disabled:opacity-40"
                  >
                    ✅ Natijani ko'rish
                  </motion.button>
                )}
              </div>

              {/* All questions nav */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      i === current ? "bg-primary text-primary-foreground" :
                      answers[i] ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                    }`}
                  >{i + 1}</button>
                ))}
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {view === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="p-8 rounded-3xl border border-border bg-card mb-6">
                <div className="text-6xl mb-4">
                  {pct === 100 ? "🏆" : pct >= 80 ? "🎉" : pct >= 60 ? "💪" : "📚"}
                </div>
                <h2 className="text-4xl font-display font-black mb-1">{result.score}/{result.total}</h2>
                <p className="text-2xl font-bold text-primary mb-1">{pct}%</p>
                <p className="text-muted-foreground font-medium mb-6">
                  {pct === 100 ? "Mukammal natija! 🌟" : pct >= 80 ? "A'lo! 👏" : pct >= 60 ? "Yaxshi harakat! 💪" : "Ko'proq mashq qiling! 📖"}
                </p>

                {/* Answers review */}
                <div className="text-left space-y-2 mb-6">
                  {questions.map((q, i) => {
                    const isCorrect = answers[i] === q.correct;
                    return (
                      <div key={i} className={`p-3 rounded-xl border text-sm ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                        <p className="font-semibold mb-1">{i + 1}. {q.question}</p>
                        <p className={isCorrect ? "text-green-600" : "text-red-500"}>
                          {isCorrect ? "✅" : "❌"} Sizning javob: {q.options[answers[i]] || "—"}
                        </p>
                        {!isCorrect && <p className="text-green-600">✅ To'g'ri: {q.options[q.correct]}</p>}
                        {q.explanation && <p className="text-muted-foreground text-xs mt-1">💡 {q.explanation}</p>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setAnswers({}); setCurrent(0); setResult(null); setView("test"); }}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold"
                  >
                    🔄 Qayta urinish
                  </motion.button>
                  <button
                    onClick={() => {
                      const text = `${pct >= 80 ? "🏆" : "💪"} Vokabi testidan o'tdim!\n\n📋 ${test.title}\n📊 Natija: ${result.score}/${result.total} (${pct}%)\n\n🔗 Sen ham sinab ko'r:\n${window.location.href}`;
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.554c-.149.668-.537.83-1.088.517l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.085 14.6l-2.953-.924c-.642-.2-.655-.642.136-.951l11.527-4.445c.537-.194 1.006.131.767.968z"/></svg>
                    Natijani Telegram da ulashish
                  </button>
                  <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Vokabi ga o'tish →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
