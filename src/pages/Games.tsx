import { AppLayout } from "@/components/AppLayout";
import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  ArrowLeft,
  Trophy,
  Zap,
  BarChart3,
  Users,
  Target,
  Crown,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DailyGameQuests } from "@/components/games/DailyGameQuests";

// Lazy load — faqat bosilganda yuklanadi
const WordMatchGame     = lazy(() => import("@/components/games/WordMatchGame").then(m => ({ default: m.WordMatchGame })));
const SpellingBeeGame   = lazy(() => import("@/components/games/SpellingBeeGame").then(m => ({ default: m.SpellingBeeGame })));
const GrammarBattleGame = lazy(() => import("@/components/games/GrammarBattleGame").then(m => ({ default: m.GrammarBattleGame })));
const FlashcardsGame    = lazy(() => import("@/components/games/FlashcardsGame").then(m => ({ default: m.FlashcardsGame })));
const HangmanGame       = lazy(() => import("@/components/games/HangmanGame").then(m => ({ default: m.HangmanGame })));
const SentenceBuilderGame = lazy(() => import("@/components/games/SentenceBuilderGame").then(m => ({ default: m.SentenceBuilderGame })));
const ListeningQuizGame = lazy(() => import("@/components/games/ListeningQuizGame").then(m => ({ default: m.ListeningQuizGame })));
const IdiomMasterGame   = lazy(() => import("@/components/games/IdiomMasterGame").then(m => ({ default: m.IdiomMasterGame })));
const LastWordGame      = lazy(() => import("@/components/games/LastWordGame").then(m => ({ default: m.LastWordGame })));
const CrosswordGame     = lazy(() => import("@/components/games/CrosswordGame").then(m => ({ default: m.CrosswordGame })));
const WordScrambleGame  = lazy(() => import("@/components/games/WordScrambleGame").then(m => ({ default: m.WordScrambleGame })));
const FillBlankGame     = lazy(() => import("@/components/games/FillBlankGame").then(m => ({ default: m.FillBlankGame })));
const SynonymGame       = lazy(() => import("@/components/games/SynonymGame").then(m => ({ default: m.SynonymGame })));
const PrepositionGame   = lazy(() => import("@/components/games/PrepositionGame").then(m => ({ default: m.PrepositionGame })));
const VerbTenseGame     = lazy(() => import("@/components/games/VerbTenseGame").then(m => ({ default: m.VerbTenseGame })));
const PhrasalVerbGame   = lazy(() => import("@/components/games/PhrasalVerbGame").then(m => ({ default: m.PhrasalVerbGame })));
const CollocationsGame  = lazy(() => import("@/components/games/CollocationsGame").then(m => ({ default: m.CollocationsGame })));
const TongueTwisterGame = lazy(() => import("@/components/games/TongueTwisterGame").then(m => ({ default: m.TongueTwisterGame })));
const ReadingSpeedGame  = lazy(() => import("@/components/games/ReadingSpeedGame").then(m => ({ default: m.ReadingSpeedGame })));
const MemoryCardGame    = lazy(() => import("@/components/games/MemoryCardGame").then(m => ({ default: m.MemoryCardGame })));
const TrueFalseGame     = lazy(() => import("@/components/games/TrueFalseGame").then(m => ({ default: m.TrueFalseGame })));
const GameTournament    = lazy(() => import("@/components/games/GameTournament").then(m => ({ default: m.GameTournament })));
const GameFriends       = lazy(() => import("@/components/games/GameFriends").then(m => ({ default: m.GameFriends })));
const GameStats         = lazy(() => import("@/components/games/GameStats").then(m => ({ default: m.GameStats })));

type GameType =
  | "menu"
  | "wordmatch"
  | "spelling"
  | "grammar"
  | "flashcards"
  | "hangman"
  | "sentence"
  | "listening"
  | "idiom"
  | "lastword"
  | "crossword"
  | "scramble"
  | "fillblank"
  | "synonym"
  | "preposition"
  | "verbtense"
  | "phrasal"
  | "collocations"
  | "tonguetwister"
  | "readingspeed"
  | "memory"
  | "truefalse"
  | "tournament"
  | "friends"
  | "stats";

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  vocab:     { label: "Lug'at boyligi",   icon: "📚" },
  grammar:   { label: "Grammatika",       icon: "📐" },
  listening: { label: "Tinglash",         icon: "🎧" },
  speed:     { label: "Tezlik va xotira", icon: "⚡" },
};

const CATEGORY_ORDER = ["vocab", "grammar", "listening", "speed"];

// Tailwind gradient nomidan (masalan "from-blue-500 to-cyan-500") asosiy
// rangni ajratib, uni hex qiymatga aylantiramiz — kartaning porlash
// (glow) effekti uchun ishlatiladi.
const COLOR_HEX: Record<string, string> = {
  blue: "#3b82f6", cyan: "#06b6d4", amber: "#f59e0b", orange: "#f97316",
  purple: "#a855f7", pink: "#ec4899", emerald: "#10b981", teal: "#14b8a6",
  red: "#ef4444", rose: "#f43f5e", indigo: "#6366f1", green: "#22c55e",
  fuchsia: "#d946ef", sky: "#0ea5e9", violet: "#8b5cf6", lime: "#84cc16",
  yellow: "#eab308",
};

const glowColor = (gradient: string) => {
  const match = gradient.match(/from-(\w+)-\d+/);
  return (match && COLOR_HEX[match[1]]) || "#6366f1";
};

const games = [
  {
    id: "wordmatch" as const,
    category: "vocab",
    title: "Word Match",
    desc: "Inglizcha-O'zbekcha so'zlarni juftlang",
    icon: "🔗",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "spelling" as const,
    category: "vocab",
    title: "Spelling Bee",
    desc: "So'zlarni to'g'ri yozing",
    icon: "🐝",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "grammar" as const,
    category: "grammar",
    title: "Grammar Battle",
    desc: "Grammatika bo'yicha savol-javob",
    icon: "⚔️",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "flashcards" as const,
    category: "vocab",
    title: "Flashcards",
    desc: "Lug'at kartochkalari bilan o'rganing",
    icon: "🃏",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "hangman" as const,
    category: "vocab",
    title: "Hangman",
    desc: "Harflarni topib, so'zni aniqlang",
    icon: "💀",
    color: "from-red-500 to-rose-500",
  },
  {
    id: "sentence" as const,
    category: "grammar",
    title: "Sentence Builder",
    desc: "So'zlarni tartibga qo'yib gap yasang",
    icon: "📝",
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "listening" as const,
    category: "listening",
    title: "Listening Quiz",
    desc: "Eshiting va savolga javob bering",
    icon: "🎧",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "idiom" as const,
    category: "vocab",
    title: "Idiom Master",
    desc: "Ingliz tili iboralarini o'rganing",
    icon: "🎭",
    color: "from-fuchsia-500 to-purple-500",
  },
  {
    id: "lastword" as const,
    category: "speed",
    title: "Last Word",
    desc: "Oxirgi harf bilan so'z toping — AI!",
    icon: "🔤",
    color: "from-orange-500 to-red-500",
    badge: "AI",
  },
  {
    id: "crossword" as const,
    category: "speed",
    title: "Crossword",
    desc: "Krossword jumboqini yeching",
    icon: "🧩",
    color: "from-sky-500 to-blue-500",
    badge: "NEW",
  },
  {
    id: "scramble" as const,
    category: "speed",
    title: "Word Scramble",
    desc: "Aralash harflardan so'z toping",
    icon: "🔀",
    color: "from-violet-500 to-purple-500",
    badge: "AI",
  },
  {
    id: "fillblank" as const,
    category: "grammar",
    title: "Fill in the Blank",
    desc: "Bo'sh joyni to'ldiring",
    icon: "✏️",
    color: "from-teal-500 to-cyan-500",
    badge: "AI",
  },
  {
    id: "synonym" as const,
    category: "vocab",
    title: "Synonyms",
    desc: "Sinonimlarni toping",
    icon: "🔄",
    color: "from-lime-500 to-green-500",
  },
  {
    id: "preposition" as const,
    category: "grammar",
    title: "Preposition Master",
    desc: "Predloglarni to'g'ri ishlating",
    icon: "📍",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "verbtense" as const,
    category: "grammar",
    title: "Verb Tenses",
    desc: "Fe'l zamonlarini o'rganing",
    icon: "⏰",
    color: "from-amber-500 to-yellow-500",
    badge: "AI",
  },
  {
    id: "phrasal" as const,
    category: "vocab",
    title: "Phrasal Verbs",
    desc: "Phrasal verblarni o'rganing",
    icon: "🔥",
    color: "from-red-500 to-orange-500",
  },
  {
    id: "collocations" as const,
    category: "vocab",
    title: "Collocations",
    desc: "So'z birikmalarini o'rganing",
    icon: "🧲",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "tonguetwister" as const,
    category: "vocab",
    title: "Tongue Twisters",
    desc: "Til o'gishtiruvchilarni mashq qiling",
    icon: "👅",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "readingspeed" as const,
    category: "speed",
    title: "Reading Speed",
    desc: "O'qish tezligingizni oshiring",
    icon: "⚡",
    color: "from-green-500 to-lime-500",
  },
  {
    id: "memory" as const,
    category: "speed",
    title: "Memory Cards",
    desc: "Juft kartalarni toping",
    icon: "🧠",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "truefalse" as const,
    category: "grammar",
    title: "True or False",
    desc: "To'g'ri yoki noto'g'ri?",
    icon: "✅",
    color: "from-emerald-500 to-green-500",
  },
];

export default function Games() {
  const [activeGame, setActiveGame] = useState<GameType>("menu");
  const [lastGame, setLastGame] = useLocalStorage<GameType | null>("vokabi_last_game", null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSetGame = (game: GameType) => {
    if (game !== "menu") setLastGame(game);
    setActiveGame(game);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() =>
              activeGame === "menu" ? navigate("/") : setActiveGame("menu")
            }
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Gamepad2 className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg">O'yinlar</h1>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {games.length} ta o'yin
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          </div>
        }>
        <AnimatePresence mode="wait">
          {activeGame === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-8 relative">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  className="inline-block text-5xl mb-2"
                >
                  🎮
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-display font-black mb-2 bg-gradient-to-r from-primary via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
                  O'yin tanlang
                </h2>
                <p className="text-muted-foreground">
                  O'ynab, ingliz tilini mustahkamlang — har bir g'alaba XP va streak keltiradi 🔥
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-5xl mx-auto mb-8">
                <motion.button
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSetGame("tournament")}
                  className="group p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 transition-colors text-center"
                >
                  <Crown className="w-6 h-6 text-amber-500 mx-auto mb-1.5 group-hover:scale-110 group-hover:-rotate-6 transition-transform" />
                  <p className="text-sm font-bold">Turnir</p>
                  <p className="text-[10px] text-muted-foreground">
                    Haftalik musobaqa
                  </p>
                </motion.button>
                <motion.button
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSetGame("friends")}
                  className="group p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-colors text-center"
                >
                  <Users className="w-6 h-6 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold">Do'stlar</p>
                  <p className="text-[10px] text-muted-foreground">
                    Birga o'ynash
                  </p>
                </motion.button>
                <motion.button
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSetGame("stats")}
                  className="group p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 transition-colors text-center"
                >
                  <BarChart3 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold">Statistika</p>
                  <p className="text-[10px] text-muted-foreground">
                    Batafsil tahlil
                  </p>
                </motion.button>
                <motion.button
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/leaderboard")}
                  className="group p-4 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 hover:shadow-lg hover:shadow-fuchsia-500/20 transition-colors text-center"
                >
                  <Trophy className="w-6 h-6 text-fuchsia-500 mx-auto mb-1.5 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                  <p className="text-sm font-bold">Leaderboard</p>
                  <p className="text-[10px] text-muted-foreground">
                    Top o'yinchilar
                  </p>
                </motion.button>
              </div>

              <div className="max-w-5xl mx-auto mb-8">
                <DailyGameQuests compact />
              </div>

              {lastGame && lastGame !== "menu" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-5xl mx-auto mb-6"
                >
                  <button
                    onClick={() => setActiveGame(lastGame)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors text-left"
                  >
                    <span className="text-2xl">▶️</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Oxirgi o'yin</p>
                      <p className="text-sm font-semibold text-primary capitalize">
                        {games.find(g => g.id === lastGame)?.title || lastGame} — davom ettirish
                      </p>
                    </div>
                    <span className="ml-auto text-primary opacity-60">→</span>
                  </button>
                </motion.div>
              )}

              {CATEGORY_ORDER.map((cat) => {
                const catGames = games.filter((g) => g.category === cat);
                if (catGames.length === 0) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className="max-w-5xl mx-auto mb-8">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className="text-xl">{meta.icon}</span>
                      <h3 className="font-display font-bold text-base">{meta.label}</h3>
                      <span className="text-xs text-muted-foreground">({catGames.length})</span>
                      <div className="flex-1 h-px bg-border/60 ml-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {catGames.map((game, i) => {
                        const glow = glowColor(game.color);
                        return (
                          <motion.button
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 22 }}
                            whileHover={{ y: -6 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveGame(game.id)}
                            style={{ ["--glow" as any]: glow }}
                            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-shadow duration-300 hover:shadow-[0_10px_30px_-10px_var(--glow)]"
                          >
                            {/* Yuqori porloq chiziq — o'yin rangiga mos */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${game.color} opacity-70`} />
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-[0.07] transition-opacity`}
                            />
                            <div className="flex items-start justify-between relative">
                              <motion.div
                                whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                                transition={{ duration: 0.4 }}
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-xl shadow-sm mb-2`}
                              >
                                {game.icon}
                              </motion.div>
                              {"badge" in game && game.badge && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${game.badge === "AI" ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white animate-pulse"}`}
                                >
                                  {game.badge}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold mb-0.5 relative">{game.title}</h3>
                            <p className="text-[11px] text-muted-foreground relative">
                              {game.desc}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground relative">
                              <Trophy className="w-3 h-3" /> XP
                              <Zap className="w-3 h-3 ml-1" /> Streak
                              <span className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                O'ynash →
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeGame === "wordmatch" && (
            <WordMatchGame key="wm" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "spelling" && (
            <SpellingBeeGame key="sb" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "grammar" && (
            <GrammarBattleGame key="gb" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "flashcards" && (
            <FlashcardsGame key="fc" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "hangman" && (
            <HangmanGame key="hm" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "sentence" && (
            <SentenceBuilderGame
              key="sb2"
              onBack={() => setActiveGame("menu")}
            />
          )}
          {activeGame === "listening" && (
            <ListeningQuizGame key="lq" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "idiom" && (
            <IdiomMasterGame key="im" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "lastword" && (
            <LastWordGame key="lw" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "crossword" && (
            <CrosswordGame key="cw" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "scramble" && (
            <WordScrambleGame key="ws" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "fillblank" && (
            <FillBlankGame key="fb" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "synonym" && (
            <SynonymGame key="sy" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "preposition" && (
            <PrepositionGame key="pp" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "verbtense" && (
            <VerbTenseGame key="vt" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "phrasal" && (
            <PhrasalVerbGame key="pv" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "collocations" && (
            <CollocationsGame key="cl" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "tonguetwister" && (
            <TongueTwisterGame key="tt" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "readingspeed" && (
            <ReadingSpeedGame key="rs" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "memory" && (
            <MemoryCardGame key="mc" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "truefalse" && (
            <TrueFalseGame key="tf" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "tournament" && (
            <GameTournament key="tr" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "friends" && (
            <GameFriends key="fr" onBack={() => setActiveGame("menu")} />
          )}
          {activeGame === "stats" && (
            <GameStats key="st" onBack={() => setActiveGame("menu")} />
          )}
        </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}
