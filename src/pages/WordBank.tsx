import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Plus, Search, BookOpen, Brain, Star, Trash2,
  ChevronRight, RefreshCw, CheckCircle2, XCircle, Volume2
} from "lucide-react";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  level: string;
  nextReview: string;
  interval: number; // days
  ease: number;
  reps: number;
}

const LEVELS = ["A1","A2","B1","B2","C1","C2"];

export default function WordBank() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [words, setWords] = useLocalStorage<Word[]>("vokabi_wordbank", []);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"list"|"review"|"add">("list");
  const [newWord, setNewWord] = useState({ word: "", meaning: "", example: "", level: "B1" });
  const [reviewQueue, setReviewQueue] = useState<Word[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterLevel, setFilterLevel] = useState("All");

  // Spaced repetition — SM2 algorithm
  const sm2 = (word: Word, quality: 0|1|2|3|4|5): Word => {
    let { ease, interval, reps } = word;
    if (quality >= 3) {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 6;
      else interval = Math.round(interval * ease);
      reps += 1;
    } else {
      reps = 0;
      interval = 1;
    }
    ease = Math.max(1.3, ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    return { ...word, ease, interval, reps, nextReview: nextReview.toISOString() };
  };

  const dueWords = words.filter(w => new Date(w.nextReview) <= new Date());

  const addWord = () => {
    if (!newWord.word.trim() || !newWord.meaning.trim()) return;
    const w: Word = {
      id: Date.now().toString(),
      ...newWord,
      nextReview: new Date().toISOString(),
      interval: 1,
      ease: 2.5,
      reps: 0,
    };
    setWords(prev => [w, ...prev]);
    setNewWord({ word: "", meaning: "", example: "", level: "B1" });
    setMode("list");
  };

  const startReview = () => {
    const due = words.filter(w => new Date(w.nextReview) <= new Date());
    setReviewQueue(due);
    setCurrentCard(0);
    setFlipped(false);
    setMode("review");
  };

  const rateCard = (quality: 0|1|2|3|4|5) => {
    const updated = sm2(reviewQueue[currentCard], quality);
    setWords(prev => prev.map(w => w.id === updated.id ? updated : w));
    if (currentCard + 1 < reviewQueue.length) {
      setCurrentCard(c => c + 1);
      setFlipped(false);
    } else {
      setMode("list");
    }
  };

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    speechSynthesis.speak(u);
  };

  const filtered = words.filter(w => {
    const matchSearch = w.word.toLowerCase().includes(search.toLowerCase()) || w.meaning.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === "All" || w.level === filterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <AppLayout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">📚 So'z Banki</h1>
            <p className="text-muted-foreground mt-1">{words.length} ta so'z · {dueWords.length} ta takrorlash kerak</p>
          </div>
          <div className="flex gap-2">
            {dueWords.length > 0 && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={startReview}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shadow-glow"
              >
                <Brain className="w-4 h-4" /> Takrorlash ({dueWords.length})
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setMode("add")}
              className="btn-outline flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Plus className="w-4 h-4" /> So'z qo'shish
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ADD WORD */}
          {mode === "add" && (
            <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="card-elevated rounded-2xl p-6 mb-6"
            >
              <h2 className="font-bold text-lg mb-4">Yangi so'z qo'shish</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Inglizcha so'z *</label>
                  <input value={newWord.word} onChange={e => setNewWord(p => ({ ...p, word: e.target.value }))}
                    placeholder="e.g. Eloquent"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ma'nosi (o'zbekcha) *</label>
                  <input value={newWord.meaning} onChange={e => setNewWord(p => ({ ...p, meaning: e.target.value }))}
                    placeholder="e.g. Notiq, so'zamol"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Misol jumla</label>
                  <input value={newWord.example} onChange={e => setNewWord(p => ({ ...p, example: e.target.value }))}
                    placeholder="e.g. He is an eloquent speaker."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Daraja</label>
                  <select value={newWord.level} onChange={e => setNewWord(p => ({ ...p, level: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={addWord} className="btn-primary px-6 py-2.5 text-sm">Saqlash</button>
                <button onClick={() => setMode("list")} className="btn-outline px-6 py-2.5 text-sm">Bekor qilish</button>
              </div>
            </motion.div>
          )}

          {/* REVIEW MODE */}
          {mode === "review" && reviewQueue.length > 0 && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <p className="text-sm text-muted-foreground mb-4">{currentCard + 1} / {reviewQueue.length}</p>
              <div className="max-w-lg mx-auto">
                <motion.div
                  onClick={() => setFlipped(f => !f)}
                  style={{ perspective: 1000 }}
                  className="cursor-pointer mb-6"
                >
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformStyle: "preserve-3d", position: "relative", minHeight: 220 }}
                  >
                    {/* Front */}
                    <div className="card-elevated rounded-2xl p-10 absolute inset-0 flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <p className="text-4xl font-display font-bold mb-3">{reviewQueue[currentCard]?.word}</p>
                      <button onClick={e => { e.stopPropagation(); speak(reviewQueue[currentCard]?.word); }}
                        className="text-primary hover:opacity-70 transition-opacity"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <p className="text-muted-foreground text-sm mt-4">Kartani bosing →</p>
                    </div>
                    {/* Back */}
                    <div className="card-elevated rounded-2xl p-8 absolute inset-0 flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <p className="text-2xl font-bold mb-2">{reviewQueue[currentCard]?.meaning}</p>
                      {reviewQueue[currentCard]?.example && (
                        <p className="text-muted-foreground text-sm italic mt-2">"{reviewQueue[currentCard].example}"</p>
                      )}
                      <span className="mt-3 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{reviewQueue[currentCard]?.level}</span>
                    </div>
                  </motion.div>
                </motion.div>

                {flipped && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center gap-3 flex-wrap"
                  >
                    <button onClick={() => rateCard(1)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium transition-colors">😰 Bilmadim</button>
                    <button onClick={() => rateCard(3)} className="px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 text-sm font-medium transition-colors">🤔 Qiyin</button>
                    <button onClick={() => rateCard(4)} className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-sm font-medium transition-colors">😊 Yaxshi</button>
                    <button onClick={() => rateCard(5)} className="px-4 py-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 text-sm font-medium transition-colors">🎯 Oson</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* LIST MODE */}
          {mode === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="So'z qidirish..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {["All", ...LEVELS].map(l => (
                    <button key={l} onClick={() => setFilterLevel(l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterLevel === l ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                    >{l}</button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hali so'z qo'shilmagan</p>
                  <button onClick={() => setMode("add")} className="btn-primary mt-4 px-5 py-2.5 text-sm">So'z qo'shish</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((w, i) => {
                    const isDue = new Date(w.nextReview) <= new Date();
                    return (
                      <motion.div key={w.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className={`card-elevated rounded-xl p-4 border ${isDue ? "border-primary/30" : "border-border/40"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{w.word}</p>
                              <button onClick={() => speak(w.word)} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">{w.level}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{w.meaning}</p>
                            {w.example && <p className="text-xs text-muted-foreground/60 italic mt-1 truncate">"{w.example}"</p>}
                          </div>
                          <button onClick={() => setWords(prev => prev.filter(x => x.id !== w.id))}
                            className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {isDue && (
                          <div className="mt-2 text-[10px] text-primary flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Takrorlash vaqti keldi
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
