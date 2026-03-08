import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles } from 'lucide-react';

interface AchievementToastProps {
  achievement: { title: string; description: string; icon: string; xp_reward: number } | null;
  onDismiss: () => void;
}

export const AchievementToast = ({ achievement, onDismiss }: AchievementToastProps) => {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[360px] max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 shadow-2xl shadow-primary/20 relative overflow-hidden">
            {/* Confetti shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
            
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-4 relative z-10">
              <motion.div
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0"
              >
                {achievement.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Yutuq!</span>
                </div>
                <h4 className="font-display font-bold text-sm">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">+{achievement.xp_reward} XP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
