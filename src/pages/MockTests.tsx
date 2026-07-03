import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { supabase as _sbClient } from "@/integrations/supabase/client";
import { Loader2, Headphones, BookOpen, PenLine, Mic, Sparkles } from "lucide-react";

const supabase: any = _sbClient;

interface MockSeries {
  id: string;
  name: string;
  year: number;
  color: string | null;
  order_index: number;
  is_active: boolean;
  mock_tests: MockTest[];
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

const SKILL_META = [
  { key: "listening_test_id", label: "Listening", icon: Headphones, skill: "listening" },
  { key: "reading_test_id", label: "Reading", icon: BookOpen, skill: "reading" },
  { key: "writing_test_id", label: "Writing", icon: PenLine, skill: "writing" },
  { key: "speaking_test_id", label: "Speaking", icon: Mic, skill: "speaking" },
] as const;

export default function MockTests() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<MockSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("mock_test_series")
        .select("*, mock_tests(*)")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      const sorted = (data || []).map((s: MockSeries) => ({
        ...s,
        mock_tests: (s.mock_tests || [])
          .filter((t) => t.is_active)
          .sort((a, b) => a.test_number - b.test_number),
      }));
      setSeries(sorted);
      setLoading(false);
    })();
  }, []);

  const openSkill = (testId: string | null, skill: string) => {
    if (!testId) return;
    // Mavjud test yechish sahifasiga yo'naltiramiz — testId orqali
    navigate(`/practice?testId=${testId}&skill=${skill}`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Real IELTS Mock Testlar
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight mb-2">
            Mock Test Kutubxonasi
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Yil bo'yicha guruhlangan haqiqiy IELTS Academic testlar. Har mock 4 ta bo'lim.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Hozircha mock testlar mavjud emas</p>
            <p className="text-sm mt-1">Admin tez orada qo'shadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {series.map((s, i) => (
              <motion.section
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <h2
                  className="text-center text-xl sm:text-2xl font-display font-black mb-5 tracking-tight"
                  style={{ color: s.color || "hsl(var(--primary))" }}
                >
                  {s.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {s.mock_tests.length === 0 ? (
                    <div className="col-span-full text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-2xl">
                      Testlar tez orada qo'shiladi
                    </div>
                  ) : (
                    s.mock_tests.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-lg transition-all"
                      >
                        <p className="font-bold text-sm mb-3">
                          {t.title || `Test ${t.test_number}`}
                        </p>
                        <div className="space-y-1.5">
                          {SKILL_META.map((sk) => {
                            const testId = (t as any)[sk.key] as string | null;
                            const enabled = !!testId;
                            return (
                              <button
                                key={sk.key}
                                onClick={() => openSkill(testId, sk.skill)}
                                disabled={!enabled}
                                className={`w-full flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-lg transition-all ${
                                  enabled
                                    ? "text-foreground hover:bg-primary/10 hover:text-primary"
                                    : "text-muted-foreground/50 cursor-not-allowed"
                                }`}
                              >
                                <sk.icon className="w-3.5 h-3.5" />
                                {sk.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}