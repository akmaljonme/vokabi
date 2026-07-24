import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { toast } from "sonner";
const supabase: any = _sb;

type Question = { question: string; options: Record<string, string>; correct: string; explanation?: string; };

export default function SharedTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"intro" | "test" | "result" | "terminated">("intro");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; cheated?: boolean } | null>(null);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const MAX_WARNINGS = 3;
  const warningRef = useRef(0);
  const viewRef = useRef<string>("intro");
  const answersRef = useRef<Record<number, string>>({});
  const testRef = useRef<any>(null);
  const terminatedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { testRef.current = test; }, [test]);

  // ─── Fetch test ───
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("shared_tests").select("*").eq("id", id).single();
      if (error || !data) { toast.error("Test topilmadi"); navigate("/"); return; }
      setTest(data);
      setTimeLeft(data.questions.length * 90);
      await supabase.rpc("increment_test_views", { test_uuid: id });
      setLoading(false);
    })();
  }, [id]);

  // ─── Save result to DB ───
  const saveResult = useCallback(async (score: number, total: number, cheated: boolean, finalAnswers: Record<number, string>) => {
    const t = testRef.current;
    if (!t) return;
    const detailedAnswers = t.questions.map((q: Question, i: number) => ({
      question: q.question,
      userAnswer: q.options[finalAnswers[i]] || "Javob berilmadi",
      correctAnswer: q.options[q.correct],
      isCorrect: finalAnswers[i] === q.correct,
    }));
    await supabase.from("shared_test_results").insert({
      shared_test_id: id,
      score,
      total,
      percentage: Math.round((score / total) * 100),
      cheated,
      answers: detailedAnswers,
      completed_at: new Date().toISOString(),
    });
  }, [id]);

  // ─── Terminate test (anti-cheat) ───
  const terminateTest = useCallback(async (reason: string) => {
    if (terminatedRef.current) return;
    terminatedRef.current = true;
    setTimerActive(false);
    const t = testRef.current;
    const ans = answersRef.current;
    if (t) {
      let score = 0;
      t.questions.forEach((q: Question, i: number) => { if (ans[i] === q.correct) score++; });
      const res = { score, total: t.questions.length, cheated: true };
      setResult(res);
      await saveResult(score, t.questions.length, true, ans);
    }
    setView("terminated");
    toast.error(`Test to'xtatildi: ${reason}`);
    // Exit fullscreen
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [saveResult]);

  // ─── Submit normally ───
  const submit = useCallback(async () => {
    if (terminatedRef.current) return;
    setTimerActive(false);
    const t = testRef.current;
    const ans = answersRef.current;
    let score = 0;
    t.questions.forEach((q: Question, i: number) => { if (ans[i] === q.correct) score++; });
    const res = { score, total: t.questions.length, cheated: false };
    setResult(res);
    await saveResult(score, t.questions.length, false, ans);
    setView("result");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    window.scrollTo({ top: 0 });
  }, [saveResult]);

  // ─── Add warning ───
  const addWarning = useCallback((msg: string) => {
    if (viewRef.current !== "test" || terminatedRef.current) return;
    warningRef.current += 1;
    setWarnings(warningRef.current);
    setWarningMsg(msg);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 4000);
    if (warningRef.current >= MAX_WARNINGS) {
      terminateTest("3 marta qoidabuzarlik qayd etildi");
    }
  }, [terminateTest]);

  // ─── Anti-cheat: fullscreen exit ───
  const handleFullscreenChange = useCallback(() => {
    const isFull = !!document.fullscreenElement;
    setIsFullscreen(isFull);
    if (!isFull && viewRef.current === "test" && !terminatedRef.current) {
      addWarning(`To'la ekrandan chiqdingiz! (${warningRef.current + 1}/${MAX_WARNINGS})`);
    }
  }, [addWarning]);

  // ─── Anti-cheat: tab/window switch ───
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && viewRef.current === "test" && !terminatedRef.current) {
      addWarning(`Boshqa sahifaga o'tdingiz! (${warningRef.current + 1}/${MAX_WARNINGS})`);
    }
  }, [addWarning]);

  // ─── Anti-cheat: keyboard shortcuts ───
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (viewRef.current !== "test") return;
    const blocked = [
      e.ctrlKey && ["c","v","a","u","s","p","f","g","h","j","k","l","n","r","t","w"].includes(e.key.toLowerCase()),
      e.metaKey,
      e.key === "F12",
      e.key === "F5",
      e.altKey && e.key === "Tab",
      e.ctrlKey && e.shiftKey,
    ];
    if (blocked.some(Boolean)) {
      e.preventDefault();
      e.stopPropagation();
      addWarning(`Taqiqlangan tugma bosildi! (${warningRef.current + 1}/${MAX_WARNINGS})`);
    }
  }, [addWarning]);

  // ─── Anti-cheat: right click ───
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (viewRef.current !== "test") return;
    e.preventDefault();
    addWarning(`O'ng tugma bosildi! (${warningRef.current + 1}/${MAX_WARNINGS})`);
  }, [addWarning]);

  // ─── Anti-cheat: text selection ───
  const handleSelectStart = useCallback((e: Event) => {
    if (viewRef.current === "test") e.preventDefault();
  }, []);

  // ─── Anti-cheat: devtools detection ───
  useEffect(() => {
    if (viewRef.current !== "test") return;
    const interval = setInterval(() => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        if (viewRef.current === "test" && !terminatedRef.current) {
          terminateTest("DevTools ochildi");
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [view, terminateTest]);

  // ─── Register all event listeners ───
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [handleFullscreenChange, handleVisibilityChange, handleKeyDown, handleContextMenu, handleSelectStart]);

  // ─── Timer ───
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); submit(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [timerActive, submit]);

  // ─── Enter fullscreen & start ───
  const startTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      toast.error("To'la ekran rejimi talab qilinadi!");
      return;
    }
    setView("test");
    setTimerActive(true);
    window.scrollTo({ top: 0 });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const questions: Question[] = test?.questions || [];
  const pct = result ? Math.round((result.score / result.total) * 100) : 0;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background flex flex-col select-none" style={{ userSelect: "none", WebkitUserSelect: "none" }}>

      {/* ── Warning toast ── */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-2xl"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{warningMsg}</span>
            <span className="ml-2 px-2 py-0.5 rounded-lg bg-white/20 text-xs">
              {warnings}/{MAX_WARNINGS} ogohlantirish
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Minimal Header ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">V</span>
            </div>
            <span className="font-black text-lg tracking-tight">Vokabi</span>
          </a>

          {view === "test" && (
            <div className="flex items-center gap-3">
              {/* Warnings indicator */}
              <div className="flex gap-1">
                {Array.from({ length: MAX_WARNINGS }).map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < warnings ? "bg-red-500" : "bg-muted"}`} />
                ))}
              </div>
              {/* Shield */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-bold">
                <Shield className="w-3.5 h-3.5" /> Himoyalangan
              </div>
              {/* Timer */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm ${
                timeLeft < 60 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-muted"
              }`}>
                <Clock className="w-4 h-4" />
                {mins}:{secs.toString().padStart(2, "0")}
              </div>
              <span className="text-sm text-muted-foreground font-semibold">
                {Object.keys(answers).length}/{questions.length}
              </span>
            </div>
          )}
        </div>
        {view === "test" && (
          <div className="h-1 bg-muted">
            <motion.div className="h-full bg-primary" animate={{ width: `${((current + 1) / questions.length) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {view === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-xl mx-auto px-4 py-16"
            >
              <div className="rounded-3xl border border-border bg-card p-8 text-center mb-6">
                <div className="text-6xl mb-5">📋</div>
                <h1 className="text-2xl font-display font-black mb-3">{test.title}</h1>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-5">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{questions.length} ta savol</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />~{Math.ceil(questions.length * 1.5)} daqiqa</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold text-xs">{test.level}</span>
                </div>

                {/* Anti-cheat rules */}
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 mb-6 text-left">
                  <p className="font-black text-amber-600 text-sm mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Test qoidalari:
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 font-semibold">
                    <li>🔒 Test to'la ekran rejimida o'tkaziladi</li>
                    <li>🚫 Boshqa sahifaga o'tish taqiqlanadi</li>
                    <li>🚫 Nusxa ko'chirish va ekrandan chiqish taqiqlanadi</li>
                    <li>⚠️ 3 ta qoidabuzarlikdan so'ng test to'xtatiladi</li>
                    <li>📊 Barcha natijalar avtomatik saqlanadi</li>
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground mb-8">Do'stingiz sizga bu testni ulashdi. Boshlash uchun to'la ekran rejimi ochiladi.</p>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={startTest}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-lg shadow-primary/30"
                >
                  🚀 To'la ekranda boshlash
                </motion.button>
              </div>
              <p className="text-center text-xs text-muted-foreground">👁 Ko'rishlar: {test.view_count || 0} ta</p>
            </motion.div>
          )}

          {/* TEST */}
          {view === "test" && (
            <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="min-h-[calc(100vh-57px)] flex flex-col"
            >
              <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
                {/* Question dots */}
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {questions.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        i === current ? "bg-primary text-primary-foreground scale-110" :
                        answers[i] ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >{i + 1}</button>
                  ))}
                </div>

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
                            onClick={() => setAnswers(prev => { const n = { ...prev, [current]: key }; answersRef.current = n; return n; })}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all ${
                              answers[current] === key ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30 hover:bg-muted/50"
                            }`}
                          >
                            <span className="font-black mr-3 text-primary/60">{key}</span>{val as string}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                        className="flex-1 py-3.5 rounded-2xl border-2 border-border hover:bg-muted font-bold transition-all disabled:opacity-30"
                      >← Oldingi</button>
                      {current < questions.length - 1 ? (
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setCurrent(c => c + 1)}
                          className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold"
                        >Keyingi →</motion.button>
                      ) : (
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          onClick={submit}
                          disabled={Object.keys(answers).length < questions.length}
                          className="flex-1 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black disabled:opacity-40"
                        >✅ Natijani ko'rish</motion.button>
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

          {/* TERMINATED */}
          {view === "terminated" && (
            <motion.div key="terminated" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto px-4 py-20 text-center"
            >
              <div className="rounded-3xl border-2 border-red-500/30 bg-red-500/5 p-10">
                <div className="text-6xl mb-4">🚫</div>
                <h2 className="text-2xl font-black mb-3 text-red-500">Test to'xtatildi</h2>
                <p className="text-muted-foreground mb-2 font-semibold">3 ta qoidabuzarlik qayd etildi.</p>
                <p className="text-sm text-muted-foreground mb-8">Natijangiz avtomatik saqlandi va adminga yuborildi.</p>
                {result && (
                  <div className="rounded-2xl bg-muted/50 p-4 mb-6">
                    <p className="text-sm font-semibold text-muted-foreground">Erishilgan natija</p>
                    <p className="text-3xl font-black">{result.score}/{result.total}</p>
                    <p className="text-red-500 text-sm font-bold">⚠️ Qoidabuzarlik bilan</p>
                  </div>
                )}
                <a href="/" className="inline-flex items-center justify-center w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black">
                  Vokabi ga o'tish
                </a>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {view === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto px-4 py-12"
            >
              <div className="rounded-3xl border border-border bg-card p-8 text-center mb-6">
                <div className="text-7xl mb-4">{pct === 100 ? "🏆" : pct >= 80 ? "🎉" : pct >= 60 ? "💪" : "📚"}</div>
                <h2 className="text-5xl font-display font-black mb-2">{result.score}/{result.total}</h2>
                <p className="text-3xl font-black text-primary mb-1">{pct}%</p>
                <p className="text-muted-foreground font-semibold mb-6">
                  {pct === 100 ? "Mukammal! 🌟" : pct >= 80 ? "A'lo! 👏" : pct >= 60 ? "Yaxshi! 💪" : "Ko'proq mashq! 📖"}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { l: "To'g'ri", v: result.score, c: "text-green-500", e: "✅" },
                    { l: "Xato", v: result.total - result.score, c: "text-red-500", e: "❌" },
                    { l: "Foiz", v: `${pct}%`, c: "text-primary", e: "📊" },
                  ].map(s => (
                    <div key={s.l} className="rounded-2xl bg-muted/50 p-3">
                      <p className="text-lg mb-0.5">{s.e}</p>
                      <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
                      <p className="text-xs text-muted-foreground font-semibold">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      const text = `${pct >= 80 ? "🏆" : "💪"} Vokabi testidan o'tdim!\n\n📋 ${test.title}\n📊 Natija: ${result.score}/${result.total} (${pct}%)\n\n🔗 Sen ham sinab ko'r:\n${window.location.href}`;
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#2AABEE,#229ED9)" }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.554c-.149.668-.537.83-1.088.517l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.085 14.6l-2.953-.924c-.642-.2-.655-.642.136-.951l11.527-4.445c.537-.194 1.006.131.767.968z"/></svg>
                    Telegram da ulashish
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setAnswers({}); answersRef.current = {}; setCurrent(0); setResult(null); warningRef.current = 0; setWarnings(0); terminatedRef.current = false; setView("intro"); }}
                    className="w-full py-3.5 rounded-2xl bg-muted hover:bg-muted/80 font-bold"
                  >🔄 Qayta urinish</motion.button>
                </div>
              </div>

              {/* Answers */}
              <div className="rounded-3xl border border-border bg-card p-6 mb-8">
                <h3 className="font-black text-base mb-4">📝 Javoblar tahlili</h3>
                <div className="space-y-3">
                  {questions.map((q, i) => {
                    const userAns = answersRef.current[i];
                    const ok = userAns === q.correct;
                    return (
                      <div key={i} className={`p-4 rounded-2xl border text-sm ${ok ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                        <div className="flex items-start gap-2 mb-1">
                          {ok ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                          <p className="font-semibold">{i + 1}. {q.question}</p>
                        </div>
                        {!ok && (
                          <div className="ml-6 space-y-0.5 text-xs">
                            <p className="text-red-500">Sizning: {q.options[userAns] || "Javob berilmadi"}</p>
                            <p className="text-green-500 font-bold">To'g'ri: {q.options[q.correct]}</p>
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
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                  IELTS & CEFR testlari, AI baholash, 20+ interaktiv o'yin, Speaking va Writing — barchasi bir joyda.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[["📝","IELTS & CEFR"],["🤖","AI Writing & Speaking"],["🎮","20+ o'yin"],["📈","Progress tracking"]].map(([e, t]) => (
                    <div key={t} className="flex items-center gap-2 p-3 rounded-2xl bg-background border border-border text-left">
                      <span className="text-lg">{e}</span><span className="font-semibold text-xs">{t}</span>
                    </div>
                  ))}
                </div>
                <a href="/" className="inline-flex items-center justify-center w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-primary/30 hover:opacity-90 transition-all">
                  Vokabi ni bepul sinab ko'ring →
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {view === "intro" && (
        <footer className="border-t border-border py-6 px-4">
          <div className="max-w-xl mx-auto rounded-2xl bg-primary/5 border border-primary/15 p-5 text-center">
            <p className="font-black text-sm mb-1">Vokabi.uz — Ingliz tilini o'rganishning eng aqlli yo'li</p>
            <p className="text-xs text-muted-foreground mb-3">IELTS, CEFR, AI baholash, 20+ o'yin</p>
            <a href="/" className="text-xs font-black text-primary hover:underline">Bepul boshlash →</a>
          </div>
        </footer>
      )}
    </div>
  );
}
