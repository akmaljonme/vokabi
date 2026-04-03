import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, GraduationCap, Plane, Brain, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useTheme, AgeGroup } from '@/contexts/ThemeContext';
import { Progress } from '@/components/ui/progress';
import Lottie from 'lottie-react';

const cheerMessages = [
  "Ajoyib tanlov! 🎯 Siz to'g'ri yo'ldasiz!",
  "Zo'r! 🚀 Sizning darajangiz aniqlanmoqda...",
  "Mukammal! 🎨 Sizga mos tajriba yaratilmoqda...",
  "Tayyor! 🎉 Shaxsiy o'quv rejangiz tuzilmoqda!",
];

// Simple confetti animation data
const confettiData = {
  v: "5.7.1", fr: 30, ip: 0, op: 60, w: 400, h: 400,
  layers: [{
    ty: 4, nm: "confetti", sr: 1, ks: { o: { a: 1, k: [{ t: 0, s: [100] }, { t: 60, s: [0] }] }, r: { a: 0, k: 0 }, p: { a: 0, k: [200, 200] }, s: { a: 0, k: [100, 100] } },
    shapes: Array.from({ length: 12 }, (_, i) => ({
      ty: "el", p: { a: 1, k: [{ t: 0, s: [200, 200] }, { t: 60, s: [200 + (Math.random() - 0.5) * 300, 200 + Math.random() * 200] }] },
      s: { a: 0, k: [8, 8] },
    })),
    ip: 0, op: 60,
  }],
};

const goals = [
  { id: 'ielts', label: 'IELTS / CEFR', desc: 'Xalqaro imtihonlarga tayyorlanish', icon: GraduationCap, color: 'from-blue-500 to-indigo-600' },
  { id: 'career', label: 'Karyera', desc: 'Ish uchun ingliz tilini o\'rganish', icon: Target, color: 'from-emerald-500 to-teal-600' },
  { id: 'travel', label: 'Sayohat', desc: 'Sayohatda erkin muloqot qilish', icon: Plane, color: 'from-amber-500 to-orange-600' },
  { id: 'brain', label: 'Rivojlanish', desc: 'Intellektni rivojlantirish uchun', icon: Brain, color: 'from-purple-500 to-violet-600' },
];

const ageGroups = [
  { id: 'kid' as AgeGroup, label: 'Bolalar 👶', desc: '6-12 yosh', color: 'from-pink-400 to-rose-500', emoji: '🎮' },
  { id: 'teen' as AgeGroup, label: 'O\'smirlar 🧑‍🎓', desc: '13-17 yosh', color: 'from-cyan-400 to-blue-500', emoji: '⚡' },
  { id: 'adult' as AgeGroup, label: 'Kattalar 👨‍💼', desc: '18+ yosh', color: 'from-slate-500 to-slate-700', emoji: '🎯' },
];

const timeOptions = [
  { id: 5, label: '5 daqiqa', desc: 'Kundalik tez mashq', emoji: '⏱️' },
  { id: 15, label: '15 daqiqa', desc: 'O\'rtacha intensivlik', emoji: '📚' },
  { id: 30, label: '30 daqiqa', desc: 'Jiddiy tayyorgarlik', emoji: '🔥' },
];

const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
const levelLabels: Record<string, string> = {
  A1: 'Boshlang\'ich', A2: 'Elementar', B1: 'O\'rta', B2: 'Yuqori o\'rta', C1: 'Ilg\'or',
};

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { setOnboardingData } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(2); // B1 default
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [showCheer, setShowCheer] = useState(false);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSelect = useCallback((nextStep: number) => {
    setShowCheer(true);
    setTimeout(() => {
      setShowCheer(false);
      if (nextStep >= totalSteps) {
        setOnboardingData({
          goal: selectedGoal,
          level: levels[selectedLevel],
          ageGroup: selectedAge,
          dailyMinutes: selectedTime,
          completed: true,
        });
        onComplete();
      } else {
        setStep(nextStep);
      }
    }, 1500);
  }, [selectedGoal, selectedLevel, selectedAge, selectedTime, setOnboardingData, onComplete]);

  const slideVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 mesh-gradient" />
        <motion.div
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(270 60% 50% / 0.06), transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Progress bar */}
      <div className="relative z-10 p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              {step + 1} / {totalSteps}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              O'tkazib yuborish →
            </motion.button>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(270 60% 55%))' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full opacity-50"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(270 60% 55%))' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 bg-white/30"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 pb-8">
        <AnimatePresence mode="wait">
          {showCheer ? (
            <motion.div
              key="cheer"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4"
              >
                ✨
              </motion.div>
              <p className="text-xl font-display font-bold">{cheerMessages[step]}</p>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl"
            >
              {/* Step 0: Goal */}
              {step === 0 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
                  >
                    <Sparkles className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 tracking-tight">
                    Maqsadingiz nima?
                  </h2>
                  <p className="text-muted-foreground mb-8">Sizga eng mos tajribani yaratamiz</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {goals.map((goal, i) => (
                      <motion.button
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedGoal(goal.id); handleSelect(1); }}
                        className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 border-2 
                          ${selectedGoal === goal.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}
                          backdrop-blur-sm bg-card/80`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-[0.04]`} />
                        <div className="relative flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center text-white shrink-0`}>
                            <goal.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-base mb-1">{goal.label}</h3>
                            <p className="text-sm text-muted-foreground">{goal.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Level */}
              {step === 1 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
                  >
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 tracking-tight">
                    Hozirgi darajangiz qanday?
                  </h2>
                  <p className="text-muted-foreground mb-10">Keyinroq o'zgartirishingiz mumkin</p>

                  {/* Visual Level Slider */}
                  <div className="max-w-md mx-auto mb-8">
                    <div className="flex justify-between mb-4">
                      {levels.map((level, i) => (
                        <motion.button
                          key={level}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedLevel(i)}
                          className={`relative flex flex-col items-center gap-2 transition-all duration-300 ${
                            i === selectedLevel ? 'scale-110' : 'opacity-50'
                          }`}
                        >
                          <motion.div
                            animate={i === selectedLevel ? { 
                              boxShadow: '0 0 20px hsl(var(--primary) / 0.4)',
                              scale: 1.1,
                            } : {}}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-lg transition-all
                              ${i === selectedLevel 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'}`}
                          >
                            {level}
                          </motion.div>
                          <span className={`text-xs font-medium transition-all ${
                            i === selectedLevel ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {levelLabels[level]}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Slider track */}
                    <div className="relative h-2 bg-muted rounded-full mx-7 mb-8">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary"
                        animate={{ width: `${(selectedLevel / (levels.length - 1)) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-lg"
                        animate={{ left: `${(selectedLevel / (levels.length - 1)) * 100}%` }}
                        style={{ marginLeft: '-10px' }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(2)}
                    className="btn-primary inline-flex items-center gap-2 px-8 py-3"
                  >
                    Davom etish <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

              {/* Step 2: Age Group */}
              {step === 2 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="text-5xl mb-6"
                  >
                    👤
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 tracking-tight">
                    Yosh guruhingiz?
                  </h2>
                  <p className="text-muted-foreground mb-8">Sizga mos interfeys yaratamiz</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    {ageGroups.map((age, i) => (
                      <motion.button
                        key={age.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSelectedAge(age.id); handleSelect(3); }}
                        className={`relative overflow-hidden rounded-2xl p-6 text-center transition-all border-2 backdrop-blur-sm bg-card/80
                          ${selectedAge === age.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${age.color} opacity-[0.06]`} />
                        <div className="relative">
                          <div className="text-4xl mb-3">{age.emoji}</div>
                          <h3 className="font-display font-bold text-sm mb-1">{age.label}</h3>
                          <p className="text-xs text-muted-foreground">{age.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Daily Time */}
              {step === 3 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="text-5xl mb-6"
                  >
                    ⏰
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 tracking-tight">
                    Kunlik maqsadingiz?
                  </h2>
                  <p className="text-muted-foreground mb-8">Har kuni qancha vaqt ajratasiz?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    {timeOptions.map((time, i) => (
                      <motion.button
                        key={time.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSelectedTime(time.id); handleSelect(4); }}
                        className={`relative overflow-hidden rounded-2xl p-6 text-center transition-all border-2 backdrop-blur-sm bg-card/80
                          ${selectedTime === time.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                      >
                        <div className="text-3xl mb-3">{time.emoji}</div>
                        <h3 className="font-display font-bold text-lg mb-1">{time.label}</h3>
                        <p className="text-xs text-muted-foreground">{time.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
