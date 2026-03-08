import { ArrowLeft } from 'lucide-react';
import { CEFRLevel } from '@/types/cefr';
import { levels } from '@/data/mockData';
import { motion } from 'framer-motion';

interface LevelSelectionProps {
  onSelectLevel: (level: CEFRLevel) => void;
  onBack: () => void;
}

export const LevelSelection = ({ onSelectLevel, onBack }: LevelSelectionProps) => {
  const levelColors: Record<CEFRLevel, string> = {
    A1: 'from-emerald-400 to-emerald-600',
    A2: 'from-teal-400 to-teal-600',
    B1: 'from-amber-400 to-amber-600',
    B2: 'from-orange-400 to-orange-600',
    C1: 'from-red-400 to-red-600',
  };

  return (
    <div className="min-h-screen bg-background py-8 lg:py-16">
      <div className="container mx-auto px-4">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Bosh sahifa
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <span className="premium-badge mb-4 inline-flex">DARAJA TANLASH</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 tracking-tight">
            O'z <span className="text-gradient">Darajangizni</span> Tanlang
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Ingliz tili bilim darajangizga mos CEFR testini tanlang
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {levels.map((level, index) => (
            <motion.button
              key={level.level}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => onSelectLevel(level.level)}
              className="group relative overflow-hidden rounded-2xl border border-border/50 transition-all duration-500 hover:shadow-xl bg-card p-7 text-center"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${levelColors[level.level]} opacity-0 group-hover:opacity-[0.06] transition-opacity`} />

              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${levelColors[level.level]} text-white text-2xl font-display font-bold mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {level.level}
              </div>

              <h3 className="text-base font-display font-semibold mb-1">{level.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{level.description}</p>

              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${levelColors[level.level]} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
            </motion.button>
          ))}
        </div>

        {/* Level Descriptions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <h2 className="text-xl font-display font-bold mb-6 text-center tracking-tight">Darajalar haqida</h2>
          <div className="grid gap-3">
            {[
              { level: 'A1', desc: 'Kundalik oddiy iboralar va eng asosiy jumlalarni tushuna oladi va qo\'llay oladi.' },
              { level: 'A2', desc: 'Oddiy vaziyatlarda ma\'lumot almashishni talab qiladigan sodda muloqot yurita oladi.' },
              { level: 'B1', desc: 'Sayohatda yuzaga kelishi mumkin bo\'lgan ko\'pchilik vaziyatlarni hal qila oladi.' },
              { level: 'B2', desc: 'Ona tili sifatida gaplashuvchilar bilan erkin va spontan muloqot yurita oladi.' },
              { level: 'C1', desc: 'Fikrlarni ravon va spontan ifodalab, so\'z topishda qiynalmasdan gapira oladi.' },
            ].map((item) => (
              <div key={item.level} className="flex items-start gap-3.5 p-4 rounded-xl bg-muted/30 border border-border/50">
                <span className={`px-2.5 py-1 rounded-lg bg-gradient-to-br ${levelColors[item.level as CEFRLevel]} text-white font-bold text-xs`}>
                  {item.level}
                </span>
                <p className="text-muted-foreground text-sm flex-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
