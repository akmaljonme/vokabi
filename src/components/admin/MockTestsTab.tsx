import { useEffect, useState } from "react";
import { supabase as _sbClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Loader2, ChevronDown, ChevronRight,
  Save, Palette, X,
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
  listening_test_id: string | null;
  reading_test_id: string | null;
  writing_test_id: string | null;
  speaking_test_id: string | null;
  is_active: boolean;
}
interface TestRow { id: string; title: string; skill: string; level: string; }

const SKILL_FIELDS = [
  { key: "listening_test_id", label: "Listening", skill: "listening" },
  { key: "reading_test_id", label: "Reading", skill: "reading" },
  { key: "writing_test_id", label: "Writing", skill: "writing" },
  { key: "speaking_test_id", label: "Speaking", skill: "speaking" },
] as const;

export const MockTestsTab = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [tests, setTests] = useState<Record<string, MockTest[]>>({});
  const [allTests, setAllTests] = useState<TestRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSeries, setShowNewSeries] = useState(false);
  const [newSeries, setNewSeries] = useState({ name: "", year: new Date().getFullYear(), color: "#DC2626" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: s }, { data: t }, { data: at }] = await Promise.all([
      supabase.from("mock_test_series").select("*").order("order_index"),
      supabase.from("mock_tests").select("*").order("test_number"),
      supabase.from("tests").select("id, title, skill, level").eq("is_active", true),
    ]);
    setSeries(s || []);
    const grouped: Record<string, MockTest[]> = {};
    (t || []).forEach((x: MockTest) => {
      (grouped[x.series_id] ||= []).push(x);
    });
    setTests(grouped);
    setAllTests(at || []);
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
          <p className="text-sm text-muted-foreground">IELTS mock test to'plamlarini boshqaring</p>
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
                    <div key={t.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-center gap-2 mb-2">
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {SKILL_FIELDS.map((sf) => {
                          const options = allTests.filter((x) => x.skill === sf.skill);
                          return (
                            <label key={sf.key} className="block">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                {sf.label}
                              </span>
                              <select
                                value={(t as any)[sf.key] || ""}
                                onChange={(e) => updateMockTest(t, { [sf.key]: e.target.value || null } as any)}
                                className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
                              >
                                <option value="">— Tanlanmagan —</option>
                                {options.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.level} · {o.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                          );
                        })}
                      </div>
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