import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, CheckCircle, Lock, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LEVELS = ["Barchasi", "A1", "A2", "B1", "B2", "C1", "C2"];
const TOPICS = ["Barchasi", "Daily Life", "Food", "Health", "Technology", "Environment", "Science", "Culture", "Education", "Sports", "Travel", "Society"];

export default function Articles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("Barchasi");
  const [topic, setTopic] = useState("Barchasi");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabase.from("articles").select("*").order("level").order("created_at");
    setArticles(data || []);

    if (user) {
      const { data: prog } = await supabase.from("article_progress")
        .select("*").eq("user_id", user.id);
      const map: Record<string, any> = {};
      (prog || []).forEach((p: any) => { map[p.article_id] = p; });
      setProgress(map);
    }
    setLoading(false);
  };

  const filtered = articles.filter(a => {
    const matchLevel = level === "Barchasi" || a.level === level;
    const matchTopic = topic === "Barchasi" || a.topic === topic;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchTopic && matchSearch;
  });

  const levelColors: Record<string, string> = {
    A1: "bg-green-500/20 text-green-400",
    A2: "bg-emerald-500/20 text-emerald-400",
    B1: "bg-blue-500/20 text-blue-400",
    B2: "bg-violet-500/20 text-violet-400",
    C1: "bg-orange-500/20 text-orange-400",
    C2: "bg-red-500/20 text-red-400",
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">📖 Maqolalar</h1>
          <p className="text-muted-foreground">O'qing, so'ng bilimingizni test bilan tekshiring</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Maqola qidirish..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={level} onChange={e => setLevel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
          <select value={topic} onChange={e => setTopic(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none">
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Stats */}
        {user && (
          <div className="flex gap-4 mb-6 text-sm text-muted-foreground">
            <span>📚 Jami: <b>{articles.length}</b></span>
            <span>✅ O'qilgan: <b>{Object.values(progress).filter((p: any) => p.is_read).length}</b></span>
            <span>🎯 Test: <b>{Object.values(progress).filter((p: any) => p.test_score !== null).length}</b></span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article, i) => {
              const prog = progress[article.id];
              const isRead = prog?.is_read;
              const hasTested = prog?.test_score !== null;
              const score = prog?.test_score;
              const total = prog?.test_total;

              return (
                <motion.div key={article.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => navigate(`/articles/${article.id}`)}
                  className="relative p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* Level badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelColors[article.level]}`}>
                      {article.level}
                    </span>
                    {hasTested ? (
                      <span className="text-xs font-semibold text-green-500">
                        ✅ {score}/{total}
                      </span>
                    ) : isRead ? (
                      <span className="text-xs text-amber-500 font-medium">📝 Test kutilmoqda</span>
                    ) : null}
                  </div>

                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {article.content.substring(0, 100)}...
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {article.read_time_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {article.word_count} so'z
                    </span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-muted">
                      {article.topic}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Hech narsa topilmadi</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
