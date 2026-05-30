import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, BookOpen, CheckCircle, ChevronRight, Trophy } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ArticleReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [view, setView] = useState<"reading" | "test" | "result">("reading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const { data: art } = await supabase.from("articles").select("*").eq("id", id).single();
    setArticle(art);

    const { data: qs } = await supabase.from("article_questions")
      .select("*").eq("article_id", id).order("order_num");
    setQuestions(qs || []);

    if (user) {
      const { data: prog } = await supabase.from("article_progress")
        .select("*").eq("user_id", user.id).eq("article_id", id).single();
      if (prog) {
        setProgress(prog);
        if (prog.test_score !== null) {
          setResult({ score: prog.test_score, total: prog.test_total });
          setView("result");
        } else if (prog.is_read) {
          setView("test");
        }
      }
    }
  };

  const markAsRead = async () => {
    if (!user) { toast.error("Iltimos, tizimga kiring"); return; }
    await supabase.from("article_progress").upsert({
      user_id: user.id, article_id: id, is_read: true
    }, { onConflict: "user_id,article_id" });
    setView("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitTest = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Barcha savollarga javob bering!"); return;
    }
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) score++;
    });
    const total = questions.length;
    setResult({ score, total });

    if (user) {
      await supabase.from("article_progress").upsert({
        user_id: user.id, article_id: id, is_read: true,
        test_score: score, test_total: total,
        completed_at: new Date().toISOString()
      }, { onConflict: "user_id,article_id" });
    }
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!article) return (
    <AppLayout><div className="flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div></AppLayout>
  );

  const levelColors: Record<string, string> = {
    A1: "bg-green-500/20 text-green-400", A2: "bg-emerald-500/20 text-emerald-400",
    B1: "bg-blue-500/20 text-blue-400", B2: "bg-violet-500/20 text-violet-400",
    C1: "bg-orange-500/20 text-orange-400", C2: "bg-red-500/20 text-red-400",
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back */}
        <button onClick={() => navigate("/articles")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Maqolalarga qaytish
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColors[article.level]}`}>
              {article.level}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {article.topic}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold mb-3">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {article.read_time_minutes} daqiqa</span>
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {article.word_count} so'z</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {["O'qish", "Test", "Natija"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                (view === "reading" && i === 0) || (view === "test" && i === 1) || (view === "result" && i === 2)
                  ? "bg-primary text-primary-foreground"
                  : view === "test" && i === 0 || view === "result" && i < 2
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{step}</span>
              {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* READING VIEW */}
          {view === "reading" && (
            <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div ref={contentRef}
                className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-base mb-8 bg-card p-6 lg:p-8 rounded-2xl border border-border">
                {article.content.split('\n').map((para: string, i: number) => (
                  <p key={i} className="mb-4 last:mb-0">{para}</p>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={markAsRead}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 text-base">
                <CheckCircle className="w-5 h-5" /> O'qib bo'ldim — Testni boshlash
              </motion.button>
            </motion.div>
          )}

          {/* TEST VIEW */}
          {view === "test" && (
            <motion.div key="test" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">📝 Bilimingizni tekshiring</h2>
                <p className="text-sm text-muted-foreground">{questions.length} ta savol · Har biriga javob bering</p>
              </div>

              <div className="space-y-6">
                {questions.map((q, qi) => (
                  <motion.div key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: qi * 0.08 }}
                    className="p-5 rounded-2xl border border-border bg-card"
                  >
                    <p className="font-medium mb-4">{qi + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {["A", "B", "C", "D"].map(opt => (
                        <button key={opt}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                            answers[q.id] === opt
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-primary/40 hover:bg-muted/40"
                          }`}
                        >
                          <span className="font-bold mr-2">{opt}.</span>
                          {q[`option_${opt.toLowerCase()}`]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {Object.keys(answers).length}/{questions.length} javob berildi
                </span>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={submitTest}
                  disabled={Object.keys(answers).length < questions.length}
                  className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  Natijani Ko'rish
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* RESULT VIEW */}
          {view === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8">
              <div className="text-6xl mb-4">
                {result.score === result.total ? "🏆" : result.score >= result.total * 0.7 ? "🎉" : "📚"}
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">
                {result.score}/{result.total}
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                {Math.round((result.score / result.total) * 100)}% to'g'ri
              </p>
              <p className="text-base font-medium mb-8 text-primary">
                {result.score === result.total ? "Mukammal natija! 🌟" :
                 result.score >= result.total * 0.8 ? "A'lo natija! 👏" :
                 result.score >= result.total * 0.6 ? "Yaxshi harakat! 💪" : "Ko'proq mashq qiling! 📖"}
              </p>

              {/* Question review */}
              <div className="text-left space-y-3 mb-8">
                {questions.map((q, i) => {
                  const userAns = answers[q.id];
                  const isCorrect = userAns === q.correct_answer;
                  return (
                    <div key={q.id} className={`p-4 rounded-xl border text-sm ${
                      isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                    }`}>
                      <p className="font-medium mb-1">{i + 1}. {q.question}</p>
                      <p className={isCorrect ? "text-green-500" : "text-red-500"}>
                        {isCorrect ? "✅" : "❌"} Sizning javob: {userAns ? q[`option_${userAns.toLowerCase()}`] : "—"}
                      </p>
                      {!isCorrect && (
                        <p className="text-green-500">✅ To'g'ri: {q[`option_${q.correct_answer.toLowerCase()}`]}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => navigate("/articles")}
                  className="px-6 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium">
                  Boshqa maqolalar
                </button>
                <button onClick={() => { setAnswers({}); setResult(null); setView("test"); }}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium">
                  Qayta urinish
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
