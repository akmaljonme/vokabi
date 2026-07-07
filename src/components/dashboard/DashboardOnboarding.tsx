import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X,
  Sparkles,
  Bot,
  Target,
  Trophy,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const STORAGE_KEY = "vokabi_dashboard_onboarding_seen_v1";

const steps = [
  {
    icon: Sparkles,
    title: "Vokabiga xush kelibsiz! 👋",
    description:
      "Bu — sizning shaxsiy dashboardingiz. Keling, asosiy qismlarini birga ko'rib chiqamiz. Bor-yo'g'i 30 soniya!",
  },
  {
    icon: Target,
    title: "Sizning taraqqiyotingiz",
    description:
      "Yuqorida darajangiz, XP progressingiz va Bugungi vazifangizni ko'rasiz. Har kuni shu yerdan davom eting.",
  },
  {
    icon: Bot,
    title: "AI Coach",
    description:
      "Sun'iy intellekt yordamchingiz kuchli va zaif tomonlaringizni tahlil qilib, nimaga e'tibor qaratish kerakligini tavsiya qiladi.",
  },
  {
    icon: Trophy,
    title: "Reyting va yutuqlar",
    description:
      "Do'stlaringiz bilan raqobatlashing, kunlik challengelarni bajaring va yangi yutuqlarni qo'lga kiriting. Omad tilaymiz! 🚀",
  },
];

export const DashboardOnboarding = ({
  forceOpen,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      /* ignore */
    }
  }, [forceOpen]);

  const finish = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    onClose?.();
  };

  if (!open) return null;

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={finish}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 overflow-hidden"
        >
          <div
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30"
            style={{ background: "hsl(var(--primary) / 0.5)" }}
          />
          <button
            onClick={finish}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <s.icon className="w-7 h-7 text-primary" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-display font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {s.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep((s2) => s2 - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                {isLast ? (
                  <Button size="sm" onClick={finish}>
                    Boshlash <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setStep((s2) => s2 + 1)}>
                    Keyingisi <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
