import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, Trophy, Palette, Megaphone, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Har safar yangi versiya chiqqanda bu qiymatni yangilang.
const VERSION = "2026.07.06";
const STORAGE_KEY = `vokabi_whats_new_${VERSION}`;

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: Mic,
    title: "Alisa — AI ovozli yordamchi",
    description: "Ovoz orqali saytni boshqaring va IELTS Speaking mashq qiling. Chap pastda joylashgan.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: Trophy,
    title: "Yangi Mock Test tizimi",
    description: "Admin belgilagan qismlar, savol turlari (true/false, multiple choice va b.) bilan.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Palette,
    title: "Yangilangan Dashboard",
    description: "Premium dizayn, tezroq animatsiyalar va yaxshilangan foydalanish tajribasi.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Megaphone,
    title: "Reklamalar dizayni",
    description: "Yangi, oqim buzmaydigan va estetik reklama komponentlari.",
    color: "from-emerald-500 to-teal-500",
  },
];

export const WhatsNewModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed left-1/2 top-1/2 z-[71] w-[min(94vw,520px)] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl">
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

              <button
                onClick={close}
                aria-label="Yopish"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/60 text-muted-foreground backdrop-blur transition hover:bg-background hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-primary">Yangilik</p>
                    <h2 className="text-xl font-bold sm:text-2xl">Vokabi'da nima yangilik?</h2>
                  </div>
                </div>

                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                  {FEATURES.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 backdrop-blur transition hover:border-primary/40 hover:bg-background/70"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}>
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base">{f.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button onClick={close} className="mt-6 w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-95">
                  Boshladik
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};