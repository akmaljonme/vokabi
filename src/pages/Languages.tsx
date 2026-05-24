import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { LANGUAGES, difficultyLabel, difficultyColor, type Language } from "@/data/languages";
import { Search, Globe, Users, ChevronRight, Star, Volume2, BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function Languages() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Language | null>(null);
  const [activePhrase, setActivePhrase] = useState<number | null>(null);
  const [myLanguages, setMyLanguages] = useLocalStorage<string[]>("vokabi_my_languages", ["english"]);

  const filtered = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  const speak = (text: string, lang: string) => {
    const langCodes: Record<string, string> = {
      english: "en-US", german: "de-DE", french: "fr-FR", spanish: "es-ES",
      italian: "it-IT", russian: "ru-RU", turkish: "tr-TR", arabic: "ar-SA",
      japanese: "ja-JP", chinese: "zh-CN", korean: "ko-KR",
    };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCodes[lang] || "en-US";
    speechSynthesis.speak(u);
  };

  const toggleMyLanguage = (id: string) => {
    setMyLanguages(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  if (selected) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Barcha tillar
          </button>

          {/* Language hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-3xl p-8 mb-6 bg-gradient-to-br ${selected.color} overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }} />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <span className="text-7xl">{selected.flag}</span>
                <div className="text-white">
                  <h1 className="text-3xl font-display font-bold">{selected.name}</h1>
                  <p className="text-white/70 text-lg">{selected.nativeName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{selected.speakers}</span>
                    <span>📝 {selected.alphabet}</span>
                    <span className={`font-semibold ${selected.difficulty === 'easy' ? 'text-green-300' : selected.difficulty === 'medium' ? 'text-yellow-300' : 'text-red-300'}`}>
                      {difficultyLabel(selected.difficulty)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => toggleMyLanguage(selected.id)}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    myLanguages.includes(selected.id)
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-white text-gray-900"
                  }`}
                >
                  {myLanguages.includes(selected.id) ? "✓ O'rganilmoqda" : "+ Qo'shish"}
                </button>
                <button onClick={() => navigate(`/language/${selected.id}`)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2 justify-center"
                >
                  <BookOpen className="w-4 h-4" /> Darslarni boshlash
                </button>
              </div>
            </div>
          </motion.div>

          {/* CEFR Levels */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {selected.levels.map((level, i) => (
              <motion.div key={level} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card-elevated rounded-2xl p-4 text-center border border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/language/${selected.id}/${level.toLowerCase()}`)}
              >
                <div className="text-2xl font-display font-bold text-primary mb-1">{level}</div>
                <div className="text-xs text-muted-foreground">
                  {level === 'A1' ? 'Boshlang\'ich' : level === 'A2' ? 'Elementar' : level === 'B1' ? 'O\'rta' : level === 'B2' ? 'Yuqori o\'rta' : level === 'C1' ? 'Ilg\'or' : 'Ustoz'}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Common Phrases */}
          <div className="card-elevated rounded-2xl p-6 border border-border/40">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span>{selected.flag}</span> Asosiy iboralar
            </h2>
            <div className="space-y-3">
              {selected.commonPhrases.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    activePhrase === i ? "border-primary/30 bg-primary/5" : "border-border/40 hover:border-primary/20"
                  }`}
                  onClick={() => setActivePhrase(activePhrase === i ? null : i)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-base">{p.phrase}</p>
                      <button onClick={e => { e.stopPropagation(); speak(p.phrase, selected.id); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.translation}</p>
                    <AnimatePresence>
                      {activePhrase === i && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-primary mt-1 font-mono"
                        >
                          /{p.pronunciation}/
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${activePhrase === i ? "rotate-90" : ""}`} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {[
              { label: "Test ishlash", emoji: "📝", path: "/", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
              { label: "O'yinlar", emoji: "🎮", path: "/games", color: "bg-green-500/10 text-green-500 border-green-500/20" },
              { label: "Lug'at", emoji: "📚", path: "/wordbank", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
            ].map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)}
                className={`p-4 rounded-xl border font-medium text-sm flex items-center gap-3 hover:opacity-80 transition-opacity ${a.color}`}
              >
                <span className="text-2xl">{a.emoji}</span> {a.label}
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="premium-badge mb-4 inline-flex"><Globe className="w-3.5 h-3.5" /> 11 TIL</span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-3 text-balance">
            Qaysi tilni <span className="text-gradient">o'rganasiz?</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">AI-powered testlar va o'yinlar bilan istalgan tilni o'rganing</p>
        </motion.div>

        {/* My languages */}
        {myLanguages.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> O'rganayotgan tillarim
            </h2>
            <div className="flex gap-3 flex-wrap">
              {myLanguages.map(id => {
                const lang = LANGUAGES.find(l => l.id === id);
                if (!lang) return null;
                return (
                  <button key={id} onClick={() => setSelected(lang)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${lang.color} text-white font-medium text-sm shadow-md hover:opacity-90 transition-opacity`}
                  >
                    {lang.flag} {lang.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Til qidirish..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Language grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((lang, i) => (
            <motion.div key={lang.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(lang)}
              className="group card-elevated rounded-2xl overflow-hidden cursor-pointer border border-border/40 hover:border-primary/30 transition-all"
            >
              {/* Top gradient */}
              <div className={`h-24 bg-gradient-to-br ${lang.color} flex items-center justify-center relative`}>
                <span className="text-5xl drop-shadow-md">{lang.flag}</span>
                {myLanguages.includes(lang.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 text-white/70 text-xs font-medium">{lang.greeting}</div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-bold">{lang.name}</h3>
                    <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                  </div>
                  <span className={`text-xs font-semibold ${difficultyColor(lang.difficulty)}`}>
                    {difficultyLabel(lang.difficulty)}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{lang.speakers}</span>
                  <span>·</span>
                  <span>{lang.levels.length} daraja</span>
                </div>

                <div className="flex gap-1 mt-3 flex-wrap">
                  {lang.levels.slice(0, 4).map(l => (
                    <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{l}</span>
                  ))}
                  {lang.levels.length > 4 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">+{lang.levels.length - 4}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>"{search}" tili topilmadi</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
