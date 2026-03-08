import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, ArrowLeft, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { WordMatchGame } from '@/components/games/WordMatchGame';
import { SpellingBeeGame } from '@/components/games/SpellingBeeGame';
import { GrammarBattleGame } from '@/components/games/GrammarBattleGame';
import { FlashcardsGame } from '@/components/games/FlashcardsGame';

type GameType = 'menu' | 'wordmatch' | 'spelling' | 'grammar' | 'flashcards';

const games = [
  { id: 'wordmatch' as const, title: 'Word Match', desc: 'Inglizcha-O\'zbekcha so\'zlarni juftlang', icon: '🔗', color: 'from-blue-500 to-cyan-500' },
  { id: 'spelling' as const, title: 'Spelling Bee', desc: 'So\'zlarni to\'g\'ri yozing', icon: '🐝', color: 'from-amber-500 to-orange-500' },
  { id: 'grammar' as const, title: 'Grammar Battle', desc: 'Grammatika bo\'yicha tezkor savol-javob', icon: '⚔️', color: 'from-purple-500 to-pink-500' },
  { id: 'flashcards' as const, title: 'Flashcards', desc: 'Lug\'at kartochkalari bilan o\'rganing', icon: '🃏', color: 'from-emerald-500 to-teal-500' },
];

export default function Games() {
  const [activeGame, setActiveGame] = useState<GameType>('menu');
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => activeGame === 'menu' ? navigate('/') : setActiveGame('menu')} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Gamepad2 className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg">O'yinlar</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeGame === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-display font-bold mb-2">🎮 O'yin tanlang</h2>
                <p className="text-muted-foreground">O'yin orqali ingliz tilini o'rganing!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {games.map((game, i) => (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setActiveGame(game.id)}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className="text-4xl mb-4">{game.icon}</div>
                    <h3 className="text-xl font-bold mb-1">{game.title}</h3>
                    <p className="text-sm text-muted-foreground">{game.desc}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Trophy className="w-3.5 h-3.5" /> XP qozing
                      <Zap className="w-3.5 h-3.5 ml-2" /> Streak oshiring
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {activeGame === 'wordmatch' && <WordMatchGame key="wm" onBack={() => setActiveGame('menu')} />}
          {activeGame === 'spelling' && <SpellingBeeGame key="sb" onBack={() => setActiveGame('menu')} />}
          {activeGame === 'grammar' && <GrammarBattleGame key="gb" onBack={() => setActiveGame('menu')} />}
          {activeGame === 'flashcards' && <FlashcardsGame key="fc" onBack={() => setActiveGame('menu')} />}
        </AnimatePresence>
      </main>
    </div>
  );
}
