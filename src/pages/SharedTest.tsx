import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, BookOpen, CheckCircle, XCircle } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
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
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchTest = async () => {
      const { data, error } = await supabase.from("shared_tests").select("*").eq("id", id).single();
      if (error || !data) { toast.error("Test topilmadi"); navigate("/"); return; }
      setTest(data);
      setTimeLeft(data.questions.length * 90);
      await supabase.rpc("increment_test_views", { test_uuid: id });
      setLoading(false);
    };
    fetchTest();
  }, [id]);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); submit(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft]);

  const questions: Question[] = test?.questions || [];
  const pct = result ? Math.round((result.score / result.total) * 100) : 0;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const startTest = () => { setView("test"); setTimerActive(true); window.scrollTo({ top: 0 }); };

  const submit = () => {
    setTimerActive(false);
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) score++; });
    setResult({ score, total: questions.length });
    setView("result");
    window.scrollTo({ top: 0 });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Minimal Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo only */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">V</span>
            </div>
            <span className="font-black text-lg tracking-tight">Vokabi</span>
          </a>

          {/* Timer (only in test mode) */}
          {view === "test" && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-sm ${
              timeLeft < 60 ? "bg-red-500/10 text-red-500" : "bg-muted text-foreground"
            }`}>
              <Clock className="w-4 h-4" />
              {mins}:{secs.toString().padStart(2, "0")}
            </div>
          )}

          {/* Progress (only in test) */}
          {view === "test" && (
            <div className="text-sm text-muted-foreground font-semibold">
              {Object.keys(answers).length}/{questions.length}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {view === "test" && (
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {view === "intro" && (
            <motion.div key="intro"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-xl mx-auto px-4 py-16"
            >
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Orqaga
              </button>

              <div className="rounded-3xl border border-border bg-card p-8 text-center mb-6">
                <div className="text-6xl mb-5">📋</div>
                <h1 className="text-2xl font-display font-black mb-3">{test.title}</h1>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> {questions.length} ta savol
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> ~{Math.ceil(questions.length * 1.5)} daqiqa
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold text-xs">
                    {test.level}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Do'stingiz sizga bu testni ulashdi. Natijangizni ko'rish uchun barcha savollarga javob bering.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={startTest}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-lg shadow-primary/30 transition-all"
                >
                  Testni boshlash 🚀
                </motion.button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                👁 Ko'rishlar soni: {(test.view_count || 0)} ta
              </p>
            </motion.div>
          )}

          {/* TEST — FULLSCREEN */}
          {view === "test" && (
            <motion.div key="test"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="min-h-[calc(100vh-57px)] flex flex-col"
            >
              <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

                {/* Question number dots */}
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {questions.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        i === current
                          ? "bg-primary text-primary-foreground scale-110"
                          : answers[i]
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >{i + 1}</button>
                  ))}
                </div>

                {/* Question card */}
                <AnimatePresence mode="wait">
                  <motion.div key={current}
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-3xl border border-border bg-card p-6 lg:p-8 mb-6">
                      <div className="flex items-start gap-3 mb-6">
                        <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {current + 1}
                        </span>
                        <p className="font-semibold text-base lg:text-lg leading-relaxed">{questions[current]?.question}</p>
                      </div>

                      <div className="space-y-2.5">
                        {Object.entries(questions[current]?.options || {}).map(([key, val]) => (
                          <motion.button key={key}
                            whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
                            onClick={() => setAnswers(prev => ({ ...prev, [current]: key }))}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all ${
                              answers[current] === key
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/30 hover:bg-muted/50"
                            }`}
                          >
                            <span className="font-black mr-3 text-primary/60">{key}</span>
                            {val as string}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrent(c => Math.max(0, c - 1))}
                        disabled={current === 0}
                        className="flex-1 py-3.5 rounded-2xl border-2 border-border hover:bg-muted font-bold transition-all disabled:opacity-30"
                      >
                        ← Oldingi
                      </button>

                      {current < questions.length - 1 ? (
                        <motion.button
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setCurrent(c => c + 1)}
                          className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold transition-all"
                        >
                          Keyingi →
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          onClick={submit}
                          disabled={Object.keys(answers).length < questions.length}
                          className="flex-1 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black transition-all disabled:opacity-40"
                        >
                          ✅ Natijani ko'rish
                        </motion.button>
                      )}
                    </div>

                    {Object.keys(answers).length < questions.length && current === questions.length - 1 && (
                      <p className="text-center text-xs text-amber-500 mt-3 font-semibold">
                        ⚠️ Hali {questions.length - Object.keys(answers).length} ta savolga javob bermadingiz
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {view === "result" && result && (
            <motion.div key="result"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto px-4 py-12"
            >
              {/* Score card */}
              <div className="rounded-3xl border border-border bg-card p-8 text-center mb-6">
                <div className="text-7xl mb-4">
                  {pct === 100 ? "🏆" : pct >= 80 ? "🎉" : pct >= 60 ? "💪" : "📚"}
                </div>
                <h2 className="text-5xl font-display font-black mb-2">{result.score}/{result.total}</h2>
                <p className="text-3xl font-black text-primary mb-1">{pct}%</p>
                <p className="text-muted-foreground font-semibold mb-6">
                  {pct === 100 ? "Mukammal natija! 🌟" : pct >= 80 ? "A'lo natija! 👏" : pct >= 60 ? "Yaxshi harakat! 💪" : "Ko'proq mashq qiling! 📖"}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: "To'g'ri", value: result.score, color: "text-green-500", icon: "✅" },
                    { label: "Noto'g'ri", value: result.total - result.score, color: "text-red-500", icon: "❌" },
                    { label: "Foiz", value: `${pct}%`, color: "text-primary", icon: "📊" },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl bg-muted/50 p-3">
                      <p className="text-lg mb-0.5">{s.icon}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      const text = `${pct >= 80 ? "🏆" : "💪"} Vokabi testidan o'tdim!\n\n📋 ${test.title}\n📊 Natija: ${result.score}/${result.total} (${pct}%)\n\n🔗 Sen ham sinab ko'r:\n${window.location.href}`;
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.554c-.149.668-.537.83-1.088.517l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.085 14.6l-2.953-.924c-.642-.2-.655-.642.136-.951l11.527-4.445c.537-.194 1.006.131.767.968z"/></svg>
                    Natijani Telegram da ulashish
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setAnswers({}); setCurrent(0); setResult(null); setView("test"); setTimeLeft(questions.length * 90); setTimerActive(true); }}
                    className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black"
                  >
                    🔄 Qayta urinish
                  </motion.button>
                </div>
              </div>

              {/* Answers review */}
              <div className="rounded-3xl border border-border bg-card p-6 mb-8">
                <h3 className="font-black text-base mb-4">📝 Javoblar tahlili</h3>
                <div className="space-y-3">
                  {questions.map((q, i) => {
                    const isCorrect = answers[i] === q.correct;
                    return (
                      <div key={i} className={`p-4 rounded-2xl border text-sm ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                        <div className="flex items-start gap-2 mb-2">
                          {isCorrect ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                          <p className="font-semibold leading-snug">{i + 1}. {q.question}</p>
                        </div>
                        {!isCorrect && (
                          <div className="ml-6 space-y-0.5">
                            <p className="text-red-500 text-xs">Sizning javob: {q.options[answers[i]] || "Javob berilmadi"}</p>
                            <p className="text-green-500 text-xs font-semibold">To'g'ri: {q.options[q.correct]}</p>
                          </div>
                        )}
                        {q.explanation && <p className="ml-6 text-muted-foreground text-xs mt-1">💡 {q.explanation}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vokabi promo */}
              <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-black text-xl">V</span>
                </div>
                <h3 className="text-xl font-black mb-2">Vokabi bilan ingliz tilini o'rgan! 🚀</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
                  IELTS & CEFR testlari, AI baholash, 21+ interaktiv o'yin, Speaking va Writing mashqlari — barchasi bir joyda.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  {[
                    { emoji: "📝", text: "IELTS & CEFR testlari" },
                    { emoji: "🤖", text: "AI Writing & Speaking" },
                    { emoji: "🎮", text: "21+ interaktiv o'yin" },
                    { emoji: "📈", text: "Progress tracking" },
                  ].map(f => (
                    <div key={f.text} className="flex items-center gap-2 p-3 rounded-2xl bg-background border border-border text-left">
                      <span className="text-lg">{f.emoji}</span>
                      <span className="font-semibold text-xs">{f.text}</span>
                    </div>
                  ))}
                </div>

                <a href="/" className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-primary/30 hover:opacity-90 transition-all">
                  Vokabi ni bepul sinab ko'ring →
                </a>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer (intro only) ── */}
      {view === "intro" && (
        <footer className="border-t border-border py-6 px-4 mt-auto">
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 text-center">
              <p className="font-black text-sm mb-1">Vokabi.uz — Ingliz tilini o'rganishning eng aqlli yo'li</p>
              <p className="text-xs text-muted-foreground mb-3">IELTS, CEFR, AI baholash, 21+ o'yin</p>
              <a href="/" className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline">
                Bepul boshlash →
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
