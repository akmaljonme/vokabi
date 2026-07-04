import { useEffect, useState } from "react";
import { supabase as _sbClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Loader2, ChevronDown, ChevronRight,
  Save, Palette, X, Headphones, BookOpen, PenLine, Mic, Upload, Copy,
} from "lucide-react";

const supabase: any = _sbClient;

interface Series {
  id: string;
  name: string;
  year: number;
  color: string;
  order_index: number;
  is_active: boolean;
}
interface MockTest {
  id: string;
  series_id: string;
  test_number: number;
  title: string | null;
  is_active: boolean;
}

const SKILLS = [
  { key: "listening", label: "Listening", icon: Headphones, color: "text-blue-500" },
  { key: "reading", label: "Reading", icon: BookOpen, color: "text-emerald-500" },
  { key: "writing", label: "Writing", icon: PenLine, color: "text-amber-500" },
  { key: "speaking", label: "Speaking", icon: Mic, color: "text-rose-500" },
] as const;

const QUESTION_TYPES = [
  { v: "multiple_choice", l: "Multiple choice (bitta)" },
  { v: "multiple_choice_multi", l: "Multiple choice (ko'p)" },
  { v: "true_false_notgiven", l: "True / False / Not Given" },
  { v: "yes_no_notgiven", l: "Yes / No / Not Given" },
  { v: "matching_headings", l: "Matching headings" },
  { v: "matching_features", l: "Matching features" },
  { v: "matching_information", l: "Matching information" },
  { v: "sentence_completion", l: "Sentence completion (___)" },
  { v: "note_completion", l: "Note/table completion" },
  { v: "short_answer", l: "Short answer" },
  { v: "writing_task", l: "Writing task" },
  { v: "speaking_question", l: "Speaking question" },
];

export const MockTestsTab = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [tests, setTests] = useState<Record<string, MockTest[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedMock, setExpandedMock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSeries, setShowNewSeries] = useState(false);
  const [newSeries, setNewSeries] = useState({ name: "", year: new Date().getFullYear(), color: "#DC2626" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from("mock_test_series").select("*").order("order_index"),
      supabase.from("mock_tests").select("*").order("test_number"),
    ]);
    setSeries(s || []);
    const grouped: Record<string, MockTest[]> = {};
    (t || []).forEach((x: MockTest) => {
      (grouped[x.series_id] ||= []).push(x);
    });
    setTests(grouped);
    setLoading(false);
  };

  const createSeries = async () => {
    if (!newSeries.name.trim()) return;
    const { error } = await supabase.from("mock_test_series").insert({
      name: newSeries.name,
      year: newSeries.year,
      color: newSeries.color,
      order_index: series.length,
    });
    if (error) return toast.error(error.message);
    toast.success("To'plam yaratildi");
    setShowNewSeries(false);
    setNewSeries({ name: "", year: new Date().getFullYear(), color: "#DC2626" });
    fetchAll();
  };

  const deleteSeries = async (id: string) => {
    if (!confirm("To'plamni va uning barcha testlarini o'chirmoqchimisiz?")) return;
    await supabase.from("mock_test_series").delete().eq("id", id);
    toast.info("O'chirildi");
    fetchAll();
  };

  const toggleSeriesActive = async (s: Series) => {
    await supabase.from("mock_test_series").update({ is_active: !s.is_active }).eq("id", s.id);
    fetchAll();
  };

  const addMockTest = async (seriesId: string) => {
    const existing = tests[seriesId] || [];
    const nextNum = (existing[existing.length - 1]?.test_number || 0) + 1;
    const { error } = await supabase.from("mock_tests").insert({
      series_id: seriesId,
      test_number: nextNum,
      title: `Test ${nextNum}`,
    });
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const updateMockTest = async (t: MockTest, patch: Partial<MockTest>) => {
    await supabase.from("mock_tests").update(patch).eq("id", t.id);
    setTests((prev) => {
      const arr = [...(prev[t.series_id] || [])];
      const i = arr.findIndex((x) => x.id === t.id);
      arr[i] = { ...arr[i], ...patch };
      return { ...prev, [t.series_id]: arr };
    });
  };

  const deleteMockTest = async (t: MockTest) => {
    if (!confirm("Testni o'chirmoqchimisiz?")) return;
    await supabase.from("mock_tests").delete().eq("id", t.id);
    fetchAll();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Mock Testlar</h1>
          <p className="text-sm text-muted-foreground">IELTS mock test to'plamlari, part va savollarni to'liq boshqaring</p>
        </div>
        <button
          onClick={() => setShowNewSeries(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Yangi to'plam
        </button>
      </div>

      <AnimatePresence>
        {showNewSeries && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Yangi to'plam yaratish</h3>
              <button onClick={() => setShowNewSeries(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={newSeries.name}
                onChange={(e) => setNewSeries({ ...newSeries, name: e.target.value })}
                placeholder="IELTS 21 Academic 2026"
                className="col-span-2 px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
              <input
                type="number"
                value={newSeries.year}
                onChange={(e) => setNewSeries({ ...newSeries, year: +e.target.value })}
                placeholder="Yil"
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Palette className="w-4 h-4" /> Rang:
                <input
                  type="color"
                  value={newSeries.color}
                  onChange={(e) => setNewSeries({ ...newSeries, color: e.target.value })}
                  className="w-10 h-8 rounded border border-border bg-background"
                />
              </label>
              <button onClick={createSeries} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm ml-auto">
                <Save className="w-4 h-4" /> Saqlash
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {series.length === 0 && (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          Hali to'plam yo'q. "Yangi to'plam" tugmasini bosing.
        </div>
      )}

      <div className="space-y-3">
        {series.map((s) => {
          const isOpen = expanded === s.id;
          const seriesTests = tests[s.id] || [];
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="font-bold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {seriesTests.length} test
                  </span>
                </button>
                <button
                  onClick={() => toggleSeriesActive(s)}
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    s.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.is_active ? "Faol" : "Faolsiz"}
                </button>
                <button
                  onClick={() => deleteSeries(s.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border p-4 space-y-3 bg-muted/20">
                  {seriesTests.map((t) => (
                    <div key={t.id} className="rounded-xl border border-border bg-background overflow-hidden">
                      <div className="flex items-center gap-2 p-3">
                        <button
                          onClick={() => setExpandedMock(expandedMock === t.id ? null : t.id)}
                          className="text-muted-foreground"
                        >
                          {expandedMock === t.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <input
                          value={t.title || ""}
                          onChange={(e) => updateMockTest(t, { title: e.target.value })}
                          placeholder={`Test ${t.test_number}`}
                          className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm font-semibold"
                        />
                        <button
                          onClick={() => deleteMockTest(t)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {expandedMock === t.id && (
                        <div className="border-t border-border p-3 bg-muted/10">
                          <MockContentEditor mockId={t.id} />
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addMockTest(s.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Test qo'shish
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= Mock Content Editor: skills → parts → questions ================= */

interface Part {
  id: string; mock_test_id: string; skill: string; part_number: number;
  title: string | null; instruction: string | null; passage_text: string | null;
  audio_url: string | null; image_url: string | null; duration_seconds: number | null;
  order_index: number;
}
interface Question {
  id: string; part_id: string; question_number: number; question_type: string;
  question_text: string; options: any; correct_answer: any;
  group_label: string | null; points: number; extra: any;
}

const MockContentEditor = ({ mockId }: { mockId: string }) => {
  const [activeSkill, setActiveSkill] = useState<string>("listening");
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mock_test_parts")
      .select("*")
      .eq("mock_test_id", mockId)
      .order("part_number");
    setParts(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [mockId]);

  const skillParts = parts.filter((p) => p.skill === activeSkill);

  const addPart = async () => {
    const nextNum = (skillParts[skillParts.length - 1]?.part_number || 0) + 1;
    const { error } = await supabase.from("mock_test_parts").insert({
      mock_test_id: mockId, skill: activeSkill, part_number: nextNum,
      title: "", instruction: "", duration_seconds: 60 * 30,
    });
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {SKILLS.map((sk) => {
          const active = activeSkill === sk.key;
          const count = parts.filter((p) => p.skill === sk.key).length;
          return (
            <button
              key={sk.key}
              onClick={() => setActiveSkill(sk.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
              }`}
            >
              <sk.icon className="w-3.5 h-3.5" /> {sk.label}
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {skillParts.map((p) => (
            <PartCard key={p.id} part={p} onChanged={load} />
          ))}
          <button
            onClick={addPart}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50"
          >
            <Plus className="w-3.5 h-3.5" /> Part qo'shish
          </button>
        </div>
      )}
    </div>
  );
};

const PartCard = ({ part, onChanged }: { part: Part; onChanged: () => void }) => {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<Part>(part);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);

  useEffect(() => { setP(part); }, [part]);

  const loadQs = async () => {
    setQLoading(true);
    const { data } = await supabase
      .from("mock_test_questions")
      .select("*")
      .eq("part_id", part.id)
      .order("question_number");
    setQuestions(data || []);
    setQLoading(false);
  };
  useEffect(() => { if (open) loadQs(); /* eslint-disable-next-line */ }, [open]);

  const savePart = async (patch: Partial<Part>) => {
    const merged = { ...p, ...patch };
    setP(merged);
    await supabase.from("mock_test_parts").update(patch).eq("id", part.id);
  };

  const uploadFile = async (file: File, kind: "audio" | "image") => {
    const ext = file.name.split(".").pop();
    const path = `mock/${part.id}/${kind}-${Date.now()}.${ext}`;
    const bucket = kind === "audio" ? "audio" : "ad-images";
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (kind === "audio") await savePart({ audio_url: data.publicUrl });
    else await savePart({ image_url: data.publicUrl });
    toast.success("Yuklandi");
  };

  const del = async () => {
    if (!confirm("Partni o'chirmoqchimisiz?")) return;
    await supabase.from("mock_test_parts").delete().eq("id", part.id);
    onChanged();
  };

  const addQ = async () => {
    const n = (questions[questions.length - 1]?.question_number || 0) + 1;
    const { error } = await supabase.from("mock_test_questions").insert({
      part_id: part.id, question_number: n, question_type: "multiple_choice",
      question_text: "", options: ["", ""], correct_answer: [""], points: 1,
    });
    if (error) return toast.error(error.message);
    loadQs();
  };

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center gap-2 p-2">
        <button onClick={() => setOpen(!open)} className="text-muted-foreground">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="text-xs font-bold w-8">P{p.part_number}</span>
        <input
          value={p.title || ""}
          onChange={(e) => savePart({ title: e.target.value })}
          placeholder="Part sarlavhasi"
          className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs"
        />
        <button onClick={del} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/10">
          <textarea
            value={p.instruction || ""}
            onChange={(e) => savePart({ instruction: e.target.value })}
            placeholder="Ko'rsatma (masalan: You should spend 20 minutes...)"
            rows={2}
            className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs"
          />
          <textarea
            value={p.passage_text || ""}
            onChange={(e) => savePart({ passage_text: e.target.value })}
            placeholder="Reading passage / Listening transcript / Writing rubric / Speaking topic..."
            rows={5}
            className="w-full px-2 py-1.5 rounded border border-border bg-background text-xs font-mono"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="flex items-center gap-2 px-2 py-1.5 border border-dashed border-border rounded cursor-pointer text-xs">
              <Upload className="w-3.5 h-3.5" /> Audio yuklash
              <input type="file" accept="audio/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "audio")}
              />
            </label>
            <label className="flex items-center gap-2 px-2 py-1.5 border border-dashed border-border rounded cursor-pointer text-xs">
              <Upload className="w-3.5 h-3.5" /> Rasm yuklash
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "image")}
              />
            </label>
            <input
              type="number"
              value={p.duration_seconds || 0}
              onChange={(e) => savePart({ duration_seconds: +e.target.value })}
              placeholder="Davomiylik (soniya)"
              className="px-2 py-1.5 rounded border border-border bg-background text-xs"
            />
          </div>

          {(p.audio_url || p.image_url) && (
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              {p.audio_url && <span>🎧 audio ✓</span>}
              {p.image_url && <span>🖼 rasm ✓</span>}
            </div>
          )}

          {/* Questions */}
          <div className="pt-2 border-t border-border/60">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Savollar
            </p>
            {qLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <div className="space-y-2">
                {questions.map((q) => (
                  <QuestionEditor key={q.id} q={q} onChanged={loadQs} />
                ))}
                <button
                  onClick={addQ}
                  className="w-full flex items-center justify-center gap-2 py-1.5 rounded border border-dashed border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/50"
                >
                  <Plus className="w-3 h-3" /> Savol qo'shish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionEditor = ({ q, onChanged }: { q: Question; onChanged: () => void }) => {
  const [local, setLocal] = useState<Question>(q);
  useEffect(() => setLocal(q), [q]);

  const save = async (patch: Partial<Question>) => {
    const merged = { ...local, ...patch };
    setLocal(merged);
    await supabase.from("mock_test_questions").update(patch).eq("id", q.id);
  };
  const del = async () => {
    if (!confirm("Savolni o'chirmoqchimisiz?")) return;
    await supabase.from("mock_test_questions").delete().eq("id", q.id);
    onChanged();
  };

  const opts: string[] = Array.isArray(local.options) ? local.options : [];
  const setOpts = (next: string[]) => save({ options: next });
  const correct: string[] = Array.isArray(local.correct_answer) ? local.correct_answer : [String(local.correct_answer ?? "")];
  const setCorrect = (next: string[]) => save({ correct_answer: next });

  const type = local.question_type;
  const showOptions = ["multiple_choice", "multiple_choice_multi", "matching_headings", "matching_features", "matching_information"].includes(type);

  return (
    <div className="rounded border border-border bg-background p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold w-6 text-center">{local.question_number}</span>
        <select
          value={local.question_type}
          onChange={(e) => save({ question_type: e.target.value })}
          className="text-[11px] px-1.5 py-1 rounded border border-border bg-background"
        >
          {QUESTION_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
        <input
          type="number"
          value={local.points}
          onChange={(e) => save({ points: +e.target.value })}
          className="w-12 text-[11px] px-1.5 py-1 rounded border border-border bg-background"
          placeholder="Ball"
        />
        <input
          value={local.group_label || ""}
          onChange={(e) => save({ group_label: e.target.value })}
          placeholder="Guruh / instruction (Questions 1-6)"
          className="flex-1 text-[11px] px-1.5 py-1 rounded border border-border bg-background"
        />
        <button onClick={del} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        value={local.question_text}
        onChange={(e) => save({ question_text: e.target.value })}
        rows={2}
        placeholder="Savol matni (sentence_completion uchun bo'sh joyni `___` bilan yozing)"
        className="w-full text-xs px-2 py-1 rounded border border-border bg-background"
      />

      {showOptions && (
        <div className="space-y-1">
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[10px] w-4 text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              <input
                value={o}
                onChange={(e) => setOpts(opts.map((x, j) => j === i ? e.target.value : x))}
                className="flex-1 text-[11px] px-1.5 py-1 rounded border border-border bg-background"
              />
              <button
                onClick={() => setOpts(opts.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setOpts([...opts, ""])}
            className="text-[10px] text-primary flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Variant
          </button>
        </div>
      )}

      {/* Correct answer input */}
      {type !== "writing_task" && type !== "speaking_question" && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground">To'g'ri:</span>
          {type === "true_false_notgiven" || type === "yes_no_notgiven" ? (
            <select
              value={correct[0] || ""}
              onChange={(e) => setCorrect([e.target.value])}
              className="text-[11px] px-1.5 py-1 rounded border border-border bg-background"
            >
              <option value="">—</option>
              {(type === "true_false_notgiven" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : type === "multiple_choice_multi" ? (
            <input
              value={correct.join(", ")}
              onChange={(e) => setCorrect(e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
              placeholder="A, B (vergul bilan)"
              className="flex-1 text-[11px] px-1.5 py-1 rounded border border-border bg-background"
            />
          ) : (
            <input
              value={correct.join(" | ")}
              onChange={(e) => setCorrect(e.target.value.split("|").map((x) => x.trim()).filter(Boolean))}
              placeholder={showOptions ? "To'g'ri variant matni" : "Javob (bir nechta variant | bilan)"}
              className="flex-1 text-[11px] px-1.5 py-1 rounded border border-border bg-background"
            />
          )}
        </div>
      )}
    </div>
  );
};