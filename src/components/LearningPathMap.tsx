import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Star, ArrowLeft, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CEFRLevel } from '@/types/cefr';

interface LearningPathMapProps {
  onSelectLevel: (level: CEFRLevel) => void;
  onBack: () => void;
}

const pathNodes = [
  { level: 'A1' as CEFRLevel, label: 'Beginner', color: 'from-emerald-400 to-emerald-600', x: 20, y: 80, emoji: '🌱' },
  { level: 'A2' as CEFRLevel, label: 'Elementary', color: 'from-teal-400 to-teal-600', x: 50, y: 60, emoji: '📘' },
  { level: 'B1' as CEFRLevel, label: 'Intermediate', color: 'from-amber-400 to-amber-600', x: 80, y: 40, emoji: '⚡' },
  { level: 'B2' as CEFRLevel, label: 'Upper-Int', color: 'from-orange-400 to-orange-600', x: 40, y: 20, emoji: '🔥' },
  { level: 'C1' as CEFRLevel, label: 'Advanced', color: 'from-red-400 to-red-600', x: 70, y: 5, emoji: '👑' },
];

export const LearningPathMap = ({ onSelectLevel, onBack }: LearningPathMapProps) => {
  const { user } = useAuth();
  const [levelScores, setLevelScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const fetchScores = async () => {
      const { data } = await supabase
        .from('test_results')
        .select('level, percentage')
        .eq('user_id', user.id);
      
      if (data) {
        const scores: Record<string, number> = {};
        data.forEach((r: any) => {
          if (!scores[r.level] || r.percentage > scores[r.level]) {
            scores[r.level] = r.percentage;
          }
        });
        setLevelScores(scores);
      }
    };
    fetchScores();
  }, [user]);

  const isUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    const prevLevel = pathNodes[index - 1].level;
    return (levelScores[prevLevel] || 0) >= 90;
  };

  const getScore = (level: string) => levelScores[level] || 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 dot-pattern opacity-10" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Orqaga
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="premium-badge mb-4 inline-flex">O'QUISH YO'LI</span>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">
            O'quv <span className="text-gradient">yo'lingiz</span>
          </h1>
          <p className="text-muted-foreground">Har bir daraja uchun 90% ball to'plang</p>
        </motion.div>

        {/* Path Map */}
        <div className="relative max-w-3xl mx-auto min-h-[600px]">
          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {pathNodes.slice(0, -1).map((node, i) => {
              const next = pathNodes[i + 1];
              const unlocked = isUnlocked(i + 1);
              return (
                <motion.line
                  key={i}
                  x1={`${node.x}%`} y1={`${node.y}%`}
                  x2={`${next.x}%`} y2={`${next.y}%`}
                  stroke={unlocked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.2)'}
                  strokeWidth="0.4"
                  strokeDasharray={unlocked ? "0" : "2 2"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: i * 0.2 }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {pathNodes.map((node, index) => {
            const unlocked = isUnlocked(index);
            const score = getScore(node.level);
            const completed = score >= 90;

            return (
              <motion.div
                key={node.level}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
                className="absolute"
                style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <motion.button
                  whileHover={unlocked ? { scale: 1.1, y: -5 } : {}}
                  whileTap={unlocked ? { scale: 0.95 } : {}}
                  onClick={() => unlocked && onSelectLevel(node.level)}
                  disabled={!unlocked}
                  className={`relative group ${!unlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Glow effect */}
                  {unlocked && (
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${node.color} blur-xl opacity-30`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Node circle */}
                  <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center
                    ${unlocked 
                      ? `bg-gradient-to-br ${node.color} text-white shadow-lg` 
                      : 'bg-muted text-muted-foreground border-2 border-border'}`}
                  >
                    {!unlocked ? (
                      <Lock className="w-6 h-6" />
                    ) : completed ? (
                      <>
                        <Check className="w-6 h-6 mb-0.5" />
                        <span className="text-xs font-bold">{score}%</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">{node.emoji}</span>
                        <span className="text-xs font-bold mt-0.5">{node.level}</span>
                      </>
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center mt-2">
                    <p className={`text-xs font-display font-bold ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {node.label}
                    </p>
                    {score > 0 && score < 90 && (
                      <div className="mt-1">
                        <div className="w-16 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${node.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{score}%</p>
                      </div>
                    )}
                    {completed && (
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        {[1,2,3].map(s => (
                          <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.button>
              </motion.div>
            );
          })}

          {/* Trophy at end */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="absolute"
            style={{ left: '90%', top: '0%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-12 h-12 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span>Ochiq</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Qulflangan (90% kerak)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Yakunlangan</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
