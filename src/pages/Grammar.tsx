import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Progress } from "@/components/ui/progress";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { GRAMMAR_TOPICS, GRAMMAR_LEVELS, GrammarTopic } from "@/lib/grammarTopics";
import { GrammarLessonModal } from "@/components/grammar/GrammarLessonModal";

interface ProgressRow {
  topic_key: string;
  score: number;
  total: number;
}

export default function Grammar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<GrammarTopic | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("grammar_progress").select("topic_key, score, total").eq("user_id", user.id);
    const map: Record<string, ProgressRow> = {};
    (data || []).forEach((r: any) => (map[r.topic_key] = r));
    setProgress(map);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCompleted = Object.keys(progress).length;
  const overallPct = Math.round((totalCompleted / GRAMMAR_TOPICS.length) * 100);

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-black flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Grammatika
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4 ml-12">
          A1'dan C2'gacha bo'lgan qoidalarni o'rganing va mashq qiling
        </p>

        <div className="mb-6 p-4 rounded-2xl border border-border/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Umumiy progress</span>
            <span className="text-sm font-bold text-primary">
              {totalCompleted} / {GRAMMAR_TOPICS.length}
            </span>
          </div>
          <Progress value={overallPct} className="h-2" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {GRAMMAR_LEVELS.map((level) => {
              const topics = GRAMMAR_TOPICS.filter((t) => t.level === level);
              const levelDone = topics.filter((t) => progress[t.key]).length;
              return (
                <div key={level}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {levelDone} / {topics.length} tugallandi
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {topics.map((topic, i) => {
                      const done = progress[topic.key];
                      return (
                        <motion.button
                          key={topic.key}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => setActiveTopic(topic)}
                          className={`text-left p-3.5 rounded-2xl border transition-colors flex items-start gap-3 ${
                            done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 hover:bg-muted/40"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              done ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {done ? <CheckCircle2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{topic.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{topic.description}</p>
                            {done && (
                              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                                {done.score}/{done.total} to'g'ri
                              </p>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {activeTopic && (
        <GrammarLessonModal
          topic={activeTopic}
          onClose={() => setActiveTopic(null)}
          onCompleted={() => load()}
        />
      )}
    </AppLayout>
  );
}
