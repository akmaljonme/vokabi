import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
  History,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import {
  LISTENING_CATEGORIES,
  LISTENING_LEVELS,
  generateListeningExercise,
  ListeningExercise,
} from "@/lib/listeningExercise";

type Stage = "setup" | "generating" | "listen" | "quiz" | "result" | "error";

interface SessionRow {
  id: string;
  level: string;
  category: string;
  score: number;
  total: number;
  created_at: string;
}

export default function Listening() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("setup");
  const [level, setLevel] = useState("B1");
  const [category, setCategory] = useState(LISTENING_CATEGORIES[0].key);
  const [exercise, setExercise] = useState<ListeningExercise | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoadingSessions(true);
    const { data } = await supabase
      .from("listening_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setSessions(data || []);
    setLoadingSessions(false);
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const start = async () => {
    setStage("generating");
    const ex = await generateListeningExercise(level, category);
    if (!ex) {
      setStage("error");
      return;
    }
    setExercise(ex);
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setPlayCount(0);
    setShowTranscript(false);
    setStage("listen");
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      setPlayCount((c) => c + 1);
    }
  };

  const answer = (optIndex: number) => {
    if (selected !== null || !exercise) return;
    setSelected(optIndex);
    const q = exercise.questions[qIndex];
    const correct = optIndex === q.correct;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (qIndex + 1 < exercise.questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
      } else {
        finish(correct ? score + 1 : score);
      }
    }, 700);
  };

  const finish = async (finalScore: number) => {
    setStage("result");
    if (!user || !exercise) return;
    await supabase.from("listening_sessions").insert({
      user_id: user.id,
      level,
      category,
      score: finalScore,
      total: exercise.questions.length,
    });
    loadSessions();
  };

  const q = exercise?.questions[qIndex];
  const avgScore =
    sessions.length > 0
      ? Math.round((sessions.reduce((s, r) => s + r.score / r.total, 0) / sessions.length) * 100)
      : null;

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => (stage === "setup" ? navigate(-1) : setStage("setup"))}
            className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-black flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" /> Listening
          </h1>
        </div>

        {stage === "setup" && (
          <div className="space-y-6">
            {avgScore !== null && (
              <div className="p-4 rounded-2xl border border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">O'rtacha natija</p>
                  <p className="text-2xl font-display font-black">{avgScore}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Bajarilgan mashqlar</p>
                  <p className="text-2xl font-display font-black">{sessions.length}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Daraja</p>
              <div className="flex gap-1.5 flex-wrap">
                {LISTENING_LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      level === l ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mavzu</p>
              <div className="grid grid-cols-2 gap-2">
                {LISTENING_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                      category === c.key ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-lg">{c.emoji}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={start}>
              <Sparkles className="w-4 h-4 mr-2" /> Yangi mashq yaratish
            </Button>

            {sessions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Oxirgi mashqlar
                </p>
                <div className="space-y-1.5">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s.level}</span>
                        {LISTENING_CATEGORIES.find((c) => c.key === s.category)?.label || s.category}
                      </span>
                      <span className={`font-semibold text-xs ${s.score / s.total >= 0.7 ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {s.score}/{s.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {stage === "generating" && (
          <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Audio mashq tayyorlanmoqda...</p>
          </div>
        )}

        {stage === "error" && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">Mashqni tuzib bo'lmadi, birozdan so'ng qayta urinib ko'ring</p>
            <Button onClick={start} variant="outline" size="sm">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Qayta urinish
            </Button>
          </div>
        )}

        {stage === "listen" && exercise && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <button
                onClick={togglePlay}
                className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                {playing ? <Pause className="w-9 h-9" /> : <Play className="w-9 h-9 ml-1" />}
              </button>
            </div>
            <audio
              ref={audioRef}
              src={exercise.audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            <p className="text-sm text-muted-foreground mb-1">
              {playCount === 0 ? "Audio'ni tinglang" : `${playCount} marta tinglandi`}
            </p>
            <p className="text-xs text-muted-foreground mb-8">Kerak bo'lsa bir necha marta qayta tinglashingiz mumkin</p>
            <Button className="w-full" size="lg" onClick={() => setStage("quiz")} disabled={playCount === 0}>
              Savollarga o'tish
            </Button>
            {playCount === 0 && (
              <p className="text-[11px] text-muted-foreground mt-2">Davom etish uchun avval tinglang</p>
            )}
          </div>
        )}

        {stage === "quiz" && q && exercise && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Savol {qIndex + 1} / {exercise.questions.length}
              </span>
              <span className="text-xs font-bold text-primary">{score} to'g'ri</span>
            </div>
            <Progress value={(qIndex / exercise.questions.length) * 100} className="h-1.5 mb-5" />
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

        {stage === "result" && exercise && (
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{score >= exercise.questions.length * 0.7 ? "🎉" : "💪"}</div>
              <h3 className="text-xl font-display font-black mb-1">
                {score} / {exercise.questions.length} to'g'ri
              </h3>
              <p className="text-sm text-muted-foreground">
                {score >= exercise.questions.length * 0.7
                  ? "Ajoyib! Matnni yaxshi tushundingiz."
                  : "Transkriptni ko'rib chiqib, yana mashq qiling."}
              </p>
            </div>

            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border/60 mb-3"
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> Transkriptni ko'rish
              </span>
              <span className="text-xs text-muted-foreground">{showTranscript ? "Yashirish" : "Ko'rsatish"}</span>
            </button>
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <p className="text-sm p-3 rounded-xl bg-muted/40 leading-relaxed">{exercise.transcript}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStage("setup")}>
                Bosh menyu
              </Button>
              <Button className="flex-1" onClick={start}>
                <Sparkles className="w-4 h-4 mr-2" /> Yana bitta
              </Button>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
