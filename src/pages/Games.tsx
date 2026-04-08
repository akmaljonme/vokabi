import { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { WordMatchGame } from "@/components/games/WordMatchGame";
import { SpellingBeeGame } from "@/components/games/SpellingBeeGame";
import { GrammarBattleGame } from "@/components/games/GrammarBattleGame";
import { FlashcardsGame } from "@/components/games/FlashcardsGame";
import { HangmanGame } from "@/components/games/HangmanGame";
import { SentenceBuilderGame } from "@/components/games/SentenceBuilderGame";
import { ListeningQuizGame } from "@/components/games/ListeningQuizGame";
import { IdiomMasterGame } from "@/components/games/IdiomMasterGame";
import { LastWordGame } from "@/components/games/LastWordGame";
import { CrosswordGame } from "@/components/games/CrosswordGame";
import { WordScrambleGame } from "@/components/games/WordScrambleGame";
import { FillBlankGame } from "@/components/games/FillBlankGame";
import { SynonymGame } from "@/components/games/SynonymGame";
import { PrepositionGame } from "@/components/games/PrepositionGame";
import { VerbTenseGame } from "@/components/games/VerbTenseGame";
import { PhrasalVerbGame } from "@/components/games/PhrasalVerbGame";
import { CollocationsGame } from "@/components/games/CollocationsGame";
import { TongueTwisterGame } from "@/components/games/TongueTwisterGame";
import { ReadingSpeedGame } from "@/components/games/ReadingSpeedGame";
import { MemoryCardGame } from "@/components/games/MemoryCardGame";
import { TrueFalseGame } from "@/components/games/TrueFalseGame";
import { GameTournament } from "@/components/games/GameTournament";
import { GameFriends } from "@/components/games/GameFriends";
import { GameStats } from "@/components/games/GameStats";
import { DailyGameQuests } from "@/components/games/DailyGameQuests";

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

const games = [
  {
    id: "wordmatch" as const,
    title: "Word Match",
    desc: "Inglizcha-O'zbekcha so'zlarni juftlang",
    icon: "🔗",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "spelling" as const,
    title: "Spelling Bee",
    desc: "So'zlarni to'g'ri yozing",
    icon: "🐝",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "grammar" as const,
    title: "Grammar Battle",
    desc: "Grammatika bo'yicha savol-javob",
    icon: "⚔️",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "flashcards" as const,
    title: "Flashcards",
    desc: "Lug'at kartochkalari bilan o'rganing",
    icon: "🃏",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "hangman" as const,
    title: "Hangman",
    desc: "Harflarni topib, so'zni aniqlang",
    icon: "💀",
    color: "from-red-500 to-rose-500",
  },
  {
    id: "sentence" as const,
    title: "Sentence Builder",
    desc: "So'zlarni tartibga qo'yib gap yasang",
    icon: "📝",
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "listening" as const,
    title: "Listening Quiz",
    desc: "Eshiting va savolga javob bering",
    icon: "🎧",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "idiom" as const,
    title: "Idiom Master",
    desc: "Ingliz tili iboralarini o'rganing",
    icon: "🎭",
    color: "from-fuchsia-500 to-purple-500",
  },
  {
    id: "lastword" as const,
    title: "Last Word",
    desc: "Oxirgi harf bilan so'z toping — AI!",
    icon: "🔤",
    color: "from-orange-500 to-red-500",
    badge: "AI",
  },
  {
    id: "crossword" as const,
    title: "Crossword",
    desc: "Krossword jumboqini yeching",
    icon: "🧩",
    color: "from-sky-500 to-blue-500",
    badge: "NEW",
  },
  {
    id: "scramble" as const,
    title: "Word Scramble",
    desc: "Aralash harflardan so'z toping",
    icon: "🔀",
    color: "from-violet-500 to-purple-500",
    badge: "AI",
  },
  {
    id: "fillblank" as const,
    title: "Fill in the Blank",
    desc: "Bo'sh joyni to'ldiring",
    icon: "✏️",
    color: "from-teal-500 to-cyan-500",
    badge: "AI",
  },
  {
    id: "synonym" as const,
    title: "Synonyms",
    desc: "Sinonimlarni toping",
    icon: "🔄",
    color: "from-lime-500 to-green-500",
  },
  {
    id: "preposition" as const,
    title: "Preposition Master",
    desc: "Predloglarni to'g'ri ishlating",
    icon: "📍",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "verbtense" as const,
    title: "Verb Tenses",
    desc: "Fe'l zamonlarini o'rganing",
    icon: "⏰",
    color: "from-amber-500 to-yellow-500",
    badge: "AI",
  },
  {
    id: "phrasal" as const,
    title: "Phrasal Verbs",
    desc: "Phrasal verblarni o'rganing",
    icon: "🔥",
    color: "from-red-500 to-orange-500",
  },
  {
    id: "collocations" as const,
    title: "Collocations",
    desc: "So'z birikmalarini o'rganing",
    icon: "🧲",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "tonguetwister" as const,
    title: "Tongue Twisters",
    desc: "Til o'gishtiruvchilarni mashq qiling",
    icon: "👅",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "readingspeed" as const,
    title: "Reading Speed",
    desc: "O'qish tezligingizni oshiring",
    icon: "⚡",
    color: "from-green-500 to-lime-500",
  },
  {
    id: "memory" as const,
    title: "Memory Cards",
    desc: "Juft kartalarni toping",
    icon: "🧠",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "truefalse" as const,
    title: "True or False",
    desc: "To'g'ri yoki noto'g'ri?",
    icon: "✅",
    color: "from-emerald-500 to-green-500",
  },
];

export default function Games() {
  const [activeGame, setActiveGame] = useState<GameType>("menu");
  const { user } = useAuth();
  const navigate = useNavigate();

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
        <AnimatePresence mode="wait">
          {activeGame === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold mb-2">
                  🎮 O'yin tanlang
                </h2>
                <p className="text-muted-foreground mb-4">
                  O'yin orqali ingliz tilini o'rganing!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-5xl mx-auto mb-8">
                <button
                  onClick={() => setActiveGame("tournament")}
                  className="group p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-center"
                >
                  <Crown className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                  <p className="text-sm font-bold">Turnir</p>
                  <p className="text-[10px] text-muted-foreground">
                    Haftalik musobaqa
                  </p>
                </button>
                <button
                  onClick={() => setActiveGame("friends")}
                  className="group p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-center"
                >
                  <Users className="w-6 h-6 text-primary mx-auto mb-1.5" />
                  <p className="text-sm font-bold">Do'stlar</p>
                  <p className="text-[10px] text-muted-foreground">
                    Birga o'ynash
                  </p>
                </button>
                <button
                  onClick={() => setActiveGame("stats")}
                  className="group p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-center"
                >
                  <BarChart3 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-sm font-bold">Statistika</p>
                  <p className="text-[10px] text-muted-foreground">
                    Batafsil tahlil
                  </p>
                </button>
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="group p-4 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 transition-all text-center"
                >
                  <Trophy className="w-6 h-6 text-fuchsia-500 mx-auto mb-1.5" />
                  <p className="text-sm font-bold">Leaderboard</p>
                  <p className="text-[10px] text-muted-foreground">
                    Top o'yinchilar
                  </p>
                </button>
              </div>

              <div className="max-w-5xl mx-auto mb-8">
                <DailyGameQuests compact />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {games.map((game, i) => (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setActiveGame(game.id)}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left hover:shadow-xl transition-all duration-300"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                    />
                    <div className="flex items-start justify-between">
                      <div className="text-2xl mb-2">{game.icon}</div>
                      {"badge" in game && game.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${game.badge === "AI" ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"}`}
                        >
                          {game.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold mb-0.5">{game.title}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {game.desc}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Trophy className="w-3 h-3" /> XP
                      <Zap className="w-3 h-3 ml-1" /> Streak
                    </div>
                  </motion.button>
                ))}
              </div>
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
      </main>
    </div>
  );
}
