import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, BookOpen, Gamepad2, Trophy, MessageCircle,
  GraduationCap, ChevronRight, X, Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "vokabi_site_tour_v1";

const STEPS = [
  {
    icon: Sparkles,
    color: "from-amber-400 to-orange-500",
    title: "Vokabi'ga xush kelibsiz! 👋",
    desc: "Sizga saytni 1 daqiqada tanishtiramiz. Boshlaymizmi?",
    cta: "Boshlash",
  },
  {
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    title: "📚 Testlar va Darajalar",
    desc: "CEFR (A1–C2) bo'yicha Reading, Listening, Writing, Speaking testlari. Darajangizni aniqlang va sertifikat oling.",
    route: "/levels",
    cta: "Keyingisi",
  },
  {
    icon: Gamepad2,
    color: "from-purple-500 to-pink-500",
    title: "🎮 21+ ta O'yin",
    desc: "O'yin orqali so'z, grammatika va talaffuzni mashq qiling. Har kuni XP to'plang.",
    route: "/games",
    cta: "Keyingisi",
  },
  {
    icon: Trophy,
    color: "from-emerald-500 to-teal-500",
    title: "🏆 Turnirlar va Reyting",
    desc: "Oylik turnirlarda qatnashing, top o'rinda pul mukofotlari va Pro obuna yutib oling.",
    route: "/tournaments",
    cta: "Keyingisi",
  },
  {
    icon: MessageCircle,
    color: "from-rose-500 to-red-500",
    title: "💬 Community Chat",
    desc: "Boshqa o'quvchilar bilan ingliz tilida muloqot qiling, audio qo'ng'iroq qiling.",
    route: "/community",
    cta: "Keyingisi",
  },
  {
    icon: GraduationCap,
    color: "from-indigo-500 to-violet-500",
    title: "🤖 AI Tutor",
    desc: "24/7 sun'iy intellekt yordamchisi essayingizni tekshiradi, talaffuzni baholaydi va savollarga javob beradi.",
    cta: "Tushundim, boshlayman!",
  },
];

export const SiteTour = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const next = () => {
    const s = STEPS[step];
    if (s.route) navigate(s.route);
    if (step === STEPS.length - 1) { close(); return; }
    setStep(step + 1);
  };

  if (!user) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            key={step}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1 w-full bg-muted">
              <motion.div
                className={`h-full bg-gradient-to-r ${current.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Close */}
            <button
              onClick={close}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors z-10"
              aria-label="Close tour"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center mb-5 shadow-lg`}
              >
                <Icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="text-xl font-display font-bold mb-2">{current.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {current.desc}
              </p>

              {/* Steps dots */}
              <div className="flex items-center gap-1.5 mb-6">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-8 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
                    }`}
                    aria-label={`Step ${i + 1}`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={close}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  O'tkazib yuborish
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                  className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${current.color} text-white font-semibold text-sm flex items-center gap-2 shadow-lg`}
                >
                  {current.cta}
                  {step === STEPS.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </motion.button>
              </div>

              {/* Step counter */}
              <p className="text-[10px] text-center text-muted-foreground mt-4">
                {step + 1} / {STEPS.length}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper to restart tour from settings/help menu
export const restartSiteTour = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};