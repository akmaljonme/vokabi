import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { supabase as _sbClient } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  QuestionRenderer,
  isCorrect,
  AUTO_GRADED,
  type MockQuestion,
} from "@/components/mock/QuestionRenderer";
import {
  Loader2, Clock, Key, ArrowRight, ArrowLeft, Send, ChevronDown,
  Headphones, BookOpen, PenLine, Mic,
} from "lucide-react";

const supabase: any = _sbClient;

type Skill = "listening" | "reading" | "writing" | "speaking";
const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_META: Record<Skill, { label: string; icon: any; duration: number }> = {
  listening: { label: "Listening", icon: Headphones, duration: 30 * 60 },
  reading: { label: "Reading", icon: BookOpen, duration: 60 * 60 },
  writing: { label: "Writing", icon: PenLine, duration: 60 * 60 },
  speaking: { label: "Speaking", icon: Mic, duration: 15 * 60 },
};

interface Part {
  id: string;
  mock_test_id: string;
  skill: Skill;
  part_number: number;
  title: string | null;
  instruction: string | null;
  passage_text: string | null;
  audio_url: string | null;
  image_url: string | null;
  duration_seconds: number | null;
  order_index: number;
}

export default function MockTestPlayer() {
  const { mockId, skill } = useParams<{ mockId: string; skill: Skill }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mock, setMock] = useState<any>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState<null | {
    score: number; total: number; band: number | null;
  }>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!mockId || !skill) return;
    (async () => {
      const [{ data: mt }, { data: p }] = await Promise.all([
        supabase.from("mock_tests").select("*, mock_test_series(*)").eq("id", mockId).maybeSingle(),
        supabase
          .from("mock_test_parts")
          .select("*")
          .eq("mock_test_id", mockId)
          .eq("skill", skill)
          .order("part_number", { ascending: true }),
      ]);
      setMock(mt);
      setParts(p || []);
      const partIds = (p || []).map((x: Part) => x.id);
      if (partIds.length) {
        const { data: qs } = await supabase
          .from("mock_test_questions")
          .select("*")
          .in("part_id", partIds)
          .order("question_number", { ascending: true });
        setQuestions((qs || []) as MockQuestion[]);
      }
      const dur = (p || [])[0]?.duration_seconds || SKILL_META[skill as Skill].duration;
      setTimeLeft(dur);
      setLoading(false);
    })();
  }, [mockId, skill]);

  // Timer
  useEffect(() => {
    if (loading || submitted) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          void handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, submitted]);

  const activePart = parts[activePartIdx];
  const partQuestions = useMemo(
    () => (activePart ? questions.filter((q) => q.part_id === activePart.id) : []),
    [activePart, questions],
  );

  const globalNumberOffset = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < activePartIdx; i++) {
      acc += questions.filter((q) => q.part_id === parts[i]?.id).length;
    }
    return acc;
  }, [activePartIdx, parts, questions]);

  const handleSubmit = async () => {
    if (submitted) return;
    // Auto-grade objective questions
    let score = 0;
    let total = 0;
    questions.forEach((q) => {
      if (AUTO_GRADED.has(q.question_type)) {
        total += Number(q.points || 1);
        if (isCorrect(q, answers[q.id])) score += Number(q.points || 1);
      }
    });
    // Simple IELTS-style band for L/R (out of 40)
    let band: number | null = null;
    if ((skill === "listening" || skill === "reading") && total > 0) {
      const raw = Math.round((score / total) * 40);
      band = rawToBand(raw);
    }
    const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
    setSubmitted({ score, total, band });

    if (user) {
      await supabase.from("mock_test_attempts").insert({
        user_id: user.id,
        mock_test_id: mockId,
        skill,
        answers,
        score,
        total,
        band_score: band,
        submitted_at: new Date().toISOString(),
        time_taken_seconds: timeTaken,
      });
    }
    toast.success(band ? `Band ${band}` : `Score ${score}/${total}`);
  };

  const nextSkill = SKILL_ORDER[SKILL_ORDER.indexOf(skill as Skill) + 1];
  const prevSkill = SKILL_ORDER[SKILL_ORDER.indexOf(skill as Skill) - 1];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!parts.length) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-24 text-center">
          <p className="text-lg font-semibold mb-2">Bu skill uchun hali kontent yo'q</p>
          <p className="text-sm text-muted-foreground mb-6">Admin tez orada qo'shadi.</p>
          <button onClick={() => navigate("/mock-tests")} className="btn-primary px-4 py-2 rounded-lg">
            Orqaga
          </button>
        </div>
      </AppLayout>
    );
  }

  if (submitted) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <Key className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-black mb-1">
            {submitted.band ? `Band ${submitted.band}` : `${submitted.score}/${submitted.total}`}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {SKILL_META[skill as Skill].label} · {mock?.title || `Test ${mock?.test_number}`}
          </p>
          <ReviewList questions={questions} parts={parts} answers={answers} />
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {nextSkill && (
              <button
                className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                onClick={() => navigate(`/mock/${mockId}/${nextSkill}`)}
              >
                Keyingi: {SKILL_META[nextSkill].label} <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              className="px-4 py-2 rounded-lg border border-border"
              onClick={() => navigate("/mock-tests")}
            >
              Mock ro'yxatiga
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const SkillIcon = SKILL_META[skill as Skill].icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate("/mock-tests")} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black"
              style={{ background: mock?.mock_test_series?.color || "hsl(var(--primary))" }}
            >
              V
            </div>
            <span className="font-display font-black tracking-tight hidden sm:inline">
              {mock?.mock_test_series?.name || "Mock"}
            </span>
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Mock Test</p>
            <p className="text-sm font-bold flex items-center justify-center gap-1.5">
              <SkillIcon className="w-4 h-4" />
              {SKILL_META[skill as Skill].label} · {mock?.title || `Test ${mock?.test_number}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-primary">
            <Clock className="w-4 h-4" />
            {fmtTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* Body: split */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 pb-24">
        {/* LEFT: passage / audio / task */}
        <motion.section
          key={activePart?.id + "-left"}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="min-w-0"
        >
          <h2 className="text-2xl font-display font-black mb-1">
            {skill === "reading" ? "PASSAGE" : skill === "writing" ? "TASK" : "PART"}{" "}
            {activePart.part_number}
          </h2>
          {activePart.instruction && (
            <p className="text-xs text-muted-foreground mb-3">{activePart.instruction}</p>
          )}

          {skill === "listening" && activePart.audio_url && (
            <div className="mb-3">
              <audio controls src={activePart.audio_url} className="w-full" />
            </div>
          )}

          {activePart.image_url && (
            <img src={activePart.image_url} alt="task" className="max-w-full rounded-lg mb-3 border border-border" />
          )}

          {activePart.title && (
            <h3 className="text-xl font-bold text-center mb-2">{activePart.title}</h3>
          )}

          {activePart.passage_text && (
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap leading-relaxed text-sm">
              {activePart.passage_text}
            </div>
          )}

          {skill === "listening" && (
            <details
              className="mt-4 rounded-lg border border-border"
              open={transcriptOpen}
              onToggle={(e) => setTranscriptOpen((e.target as HTMLDetailsElement).open)}
            >
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold flex items-center justify-between">
                Audioscript
                <ChevronDown className={`w-4 h-4 transition-transform ${transcriptOpen ? "rotate-180" : ""}`} />
              </summary>
              <div className="px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {activePart.passage_text || "—"}
              </div>
            </details>
          )}
        </motion.section>

        {/* RIGHT: questions */}
        <motion.section
          key={activePart?.id + "-right"}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="min-w-0 space-y-4"
        >
          {groupBy(partQuestions, (q) => q.group_label || "").map((group, gi) => (
            <div key={gi} className="space-y-3">
              {group[0].group_label && (
                <div>
                  <h3 className="font-bold text-sm">
                    Questions {group[0].question_number}
                    {group.length > 1 ? `-${group[group.length - 1].question_number}` : ""}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {group[0].group_label}
                  </p>
                </div>
              )}
              {group.map((q) => (
                <div key={q.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xs font-bold w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {q.question_number}
                    </span>
                    {!isInlineType(q.question_type) && q.question_text && (
                      <p className="text-sm font-medium">{q.question_text}</p>
                    )}
                  </div>
                  <QuestionRenderer
                    q={q}
                    value={answers[q.id]}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  />
                </div>
              ))}
            </div>
          ))}
        </motion.section>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur-md z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-center gap-2 flex-wrap">
          {prevSkill && (
            <button
              onClick={() => navigate(`/mock/${mockId}/${prevSkill}`)}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              {SKILL_META[prevSkill].label}
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold flex items-center gap-1"
          >
            <Key className="w-3 h-3" /> Scores
          </button>
          {parts.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActivePartIdx(i)}
              className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${
                i === activePartIdx
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {p.part_number}
            </button>
          ))}
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
          >
            <Send className="w-3 h-3" /> Submit
          </button>
          {nextSkill && (
            <button
              onClick={() => navigate(`/mock/${mockId}/${nextSkill}`)}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold flex items-center gap-1"
            >
              {SKILL_META[nextSkill].label} <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

function ReviewList({ questions, parts, answers }: { questions: MockQuestion[]; parts: Part[]; answers: Record<string, any> }) {
  return (
    <div className="text-left space-y-4 max-h-[50vh] overflow-y-auto rounded-xl border border-border p-4 bg-card/40">
      {parts.map((p) => {
        const qs = questions.filter((q) => q.part_id === p.id);
        return (
          <div key={p.id}>
            <p className="font-bold text-sm mb-2">Part {p.part_number}</p>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {qs.map((q) => {
                const auto = AUTO_GRADED.has(q.question_type);
                const ok = auto && isCorrect(q, answers[q.id]);
                return (
                  <div
                    key={q.id}
                    title={String(answers[q.id] ?? "—")}
                    className={`h-8 rounded text-[10px] font-bold flex items-center justify-center ${
                      !auto
                        ? "bg-muted text-muted-foreground"
                        : ok
                        ? "bg-emerald-500/20 text-emerald-700"
                        : "bg-red-500/15 text-red-600"
                    }`}
                  >
                    {q.question_number}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function groupBy<T>(arr: T[], key: (t: T) => string): T[][] {
  const map = new Map<string, T[]>();
  arr.forEach((x) => {
    const k = key(x);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(x);
  });
  return Array.from(map.values());
}
function isInlineType(t: string) {
  return t === "sentence_completion" || t === "note_completion" || t === "matching_headings" || t === "matching_features" || t === "matching_information";
}
function rawToBand(raw: number): number {
  // Approx IELTS Academic Listening/Reading band scale
  const table: [number, number][] = [
    [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6],
    [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5],
  ];
  for (const [min, b] of table) if (raw >= min) return b;
  return 2;
}