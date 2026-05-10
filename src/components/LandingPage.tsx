import {
  ArrowRight,
  BookOpen,
  Headphones,
  Award,
  Users,
  CheckCircle2,
  Star,
  ChevronDown,
  Zap,
  Globe,
  TrendingUp,
  Shield,
  Sparkles,
  Crown,
  Brain,
  BarChart3,
  Target,
  Mic,
  PenTool,
  MessageSquarePlus,
  Rocket,
  Trophy,
  GraduationCap,
  Gamepad2,
  Video,
  Bot,
  Languages,
  Flame,
  Medal,
  Heart,
} from "lucide-react";
import { levels } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  useScroll,
  useSpring,
  MotionValue,
} from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useIsMobile } from "@/hooks/use-mobile";

let __isMobileGlobal = false;

interface LandingPageProps {
  onStartTest: () => void;
  onGoToVocabulary?: () => void;
}

/* ─── Fade-up on scroll ─── */
const FadeUp = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Animated counter ─── */
const AnimatedCounter = ({
  value,
  suffix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
      });
      const unsub = rounded.on("change", (v) => setDisplay(v));
      return () => {
        controls.stop();
        unsub();
      };
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ─── 3D Tilt Card ─── */
const Card3D = ({
  children,
  className = "",
  glowColor = "var(--primary)",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (__isMobileGlobal) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRotateX((y - 0.5) * -12);
    setRotateY((x - 0.5) * 12);
    setGlowPos({ x: x * 100, y: y * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlowPos({ x: 50, y: 50 });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className={`relative ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, hsl(${glowColor} / 0.15) 0%, transparent 60%)`,
        }}
      />
      {children}
    </motion.div>
  );
};

/* ─── Floating particles ─── */
const FloatingParticles = () => {
  if (__isMobileGlobal) return null;
  return (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: Math.random() * 4 + 2,
          height: Math.random() * 4 + 2,
          background: `hsl(var(--primary) / ${Math.random() * 0.3 + 0.1})`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30 - Math.random() * 40, 0],
          x: [0, Math.random() * 20 - 10, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 4 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
  );
};

/* ─── Marquee ticker ─── */
const MarqueeTicker = ({
  items,
  speed = 30,
}: {
  items: string[];
  speed?: number;
}) => {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="inline-flex gap-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-lg font-display font-bold text-muted-foreground/60 tracking-tight"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export const LandingPage = ({
  onStartTest,
  onGoToVocabulary,
}: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  useEffect(() => {
    __isMobileGlobal = isMobile;
  }, [isMobile]);
  const [liveStats, setLiveStats] = useState({
    users: 0,
    tests: 0,
    avgPass: 0,
  });
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 150]), {
    stiffness: 100,
    damping: 30,
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.rpc("get_public_stats");
      if (data) {
        const stats = data as any;
        const passRate =
          stats.total_results > 0
            ? Math.round((stats.passed_results / stats.total_results) * 100)
            : 95;
        setLiveStats({
          users: stats.user_count || 0,
          tests: stats.test_count || 0,
          avgPass: passRate,
        });
      }
    };
    const fetchFeedbacks = async () => {
      const { data } = await supabase
        .from("feedbacks" as any)
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setFeedbacks(data as any[]);
    };
    fetchStats();
    fetchFeedbacks();
  }, []);

  const handleStartTest = () => {
    if (user) onStartTest();
    else navigate("/login");
  };

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#e11d48", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"],
    });
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI Tahlil & Tavsiyalar",
      desc: "Sun'iy intellekt natijalaringizni tahlil qiladi, zaif tomonlaringizni aniqlaydi va shaxsiy o'quv rejasini tuzadi.",
      color: "358 84% 50%",
      large: true,
      pro: true,
    },
    {
      icon: BookOpen,
      title: "Reading",
      desc: "CEFR formatidagi matnlar va tahlil savollari",
      color: "217 91% 60%",
    },
    {
      icon: Headphones,
      title: "Listening",
      desc: "Audio materiallar bilan tinglash ko'nikmasi",
      color: "45 93% 47%",
    },
    {
      icon: PenTool,
      title: "Writing",
      desc: "IELTS 9-ballik tizimda AI baholash",
      color: "142 76% 42%",
      pro: true,
    },
    {
      icon: Mic,
      title: "Speaking Practice",
      desc: "Ovozingizni yozib oling, AI real-time tahlil qiladi.",
      color: "270 76% 55%",
      large: true,
      pro: true,
    },
    {
      icon: Zap,
      title: "Grammatika",
      desc: "Fe'l zamonlari va gap tuzilishi testlari",
      color: "358 84% 50%",
    },
  ];

  const competitorComparison = [
    {
      feature: "AI Test Generatsiya",
      vokabi: true,
      scoreup: false,
      selflearn: false,
      duolingo: false,
    },
    {
      feature: "21+ O'yin",
      vokabi: true,
      scoreup: false,
      selflearn: false,
      duolingo: true,
    },
    {
      feature: "Writing AI Baholash",
      vokabi: true,
      scoreup: false,
      selflearn: false,
      duolingo: false,
    },
    {
      feature: "Speaking AI Tahlil",
      vokabi: true,
      scoreup: false,
      selflearn: false,
      duolingo: true,
    },
    {
      feature: "CEFR A1-C1 Testlar",
      vokabi: true,
      scoreup: true,
      selflearn: true,
      duolingo: false,
    },
    {
      feature: "Real-time Leaderboard",
      vokabi: true,
      scoreup: false,
      selflearn: false,
      duolingo: true,
    },
    {
      feature: "Telegram Bot Support",
      vokabi: true,
      scoreup: false,
      selflearn: false,
      duolingo: false,
    },
    {
      feature: "O'zbekcha Interfeys",
      vokabi: true,
      scoreup: true,
      selflearn: true,
      duolingo: false,
    },
    {
      feature: "Daily Challenges",
      vokabi: true,
      scoreup: false,
      selflearn: false,
      duolingo: true,
    },
    {
      feature: "Bepul Rejim",
      vokabi: true,
      scoreup: true,
      selflearn: true,
      duolingo: true,
    },
  ];

  // Duolingo-style colorful game chips. Each chip gets a solid color + hard offset shadow.
  const gameShowcase: { label: string; emoji: string; bg: string; shadow: string }[] = [
    { label: "Word Match",       emoji: "🔗", bg: "hsl(88 78% 45%)",  shadow: "hsl(88 78% 32%)" },
    { label: "Spelling Bee",     emoji: "🐝", bg: "hsl(45 100% 55%)", shadow: "hsl(38 95% 42%)" },
    { label: "Grammar Battle",   emoji: "⚔️", bg: "hsl(357 92% 62%)", shadow: "hsl(357 80% 45%)" },
    { label: "Flashcards",       emoji: "🃏", bg: "hsl(199 89% 53%)", shadow: "hsl(199 85% 38%)" },
    { label: "Hangman",          emoji: "💀", bg: "hsl(280 75% 55%)", shadow: "hsl(280 70% 38%)" },
    { label: "Sentence Builder", emoji: "📝", bg: "hsl(25 95% 58%)",  shadow: "hsl(20 90% 42%)" },
    { label: "Listening Quiz",   emoji: "🎧", bg: "hsl(173 75% 42%)", shadow: "hsl(173 75% 28%)" },
    { label: "Idiom Master",     emoji: "🎭", bg: "hsl(340 82% 65%)", shadow: "hsl(340 75% 48%)" },
    { label: "Last Word (AI)",   emoji: "🔤", bg: "hsl(217 91% 60%)", shadow: "hsl(217 85% 42%)" },
    { label: "Crossword",        emoji: "🧩", bg: "hsl(142 70% 45%)", shadow: "hsl(142 70% 30%)" },
    { label: "Word Scramble",    emoji: "🔀", bg: "hsl(199 89% 53%)", shadow: "hsl(199 85% 38%)" },
    { label: "Fill in the Blank",emoji: "✏️", bg: "hsl(45 100% 55%)", shadow: "hsl(38 95% 42%)" },
    { label: "Synonyms",         emoji: "🔄", bg: "hsl(173 75% 42%)", shadow: "hsl(173 75% 28%)" },
    { label: "Prepositions",     emoji: "📍", bg: "hsl(357 92% 62%)", shadow: "hsl(357 80% 45%)" },
    { label: "Verb Tenses",      emoji: "⏰", bg: "hsl(280 75% 55%)", shadow: "hsl(280 70% 38%)" },
    { label: "Phrasal Verbs",    emoji: "🔥", bg: "hsl(25 95% 58%)",  shadow: "hsl(20 90% 42%)" },
    { label: "Collocations",     emoji: "🧲", bg: "hsl(340 82% 65%)", shadow: "hsl(340 75% 48%)" },
    { label: "Tongue Twisters",  emoji: "👅", bg: "hsl(330 80% 60%)", shadow: "hsl(330 75% 42%)" },
    { label: "Reading Speed",    emoji: "⚡", bg: "hsl(45 100% 55%)", shadow: "hsl(38 95% 42%)" },
    { label: "Memory Cards",     emoji: "🧠", bg: "hsl(217 91% 60%)", shadow: "hsl(217 85% 42%)" },
    { label: "True or False",    emoji: "✅", bg: "hsl(88 78% 45%)",  shadow: "hsl(88 78% 32%)" },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[100vh] flex items-center overflow-hidden"
      >
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <FloatingParticles />

        {!isMobile && <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary)), transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />}
        {!isMobile && <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--neon-purple)), transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />}

        <motion.div
          style={isMobile ? undefined : { y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              className="premium-badge mb-8 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>#1 AI-Powered Language Learning Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-display font-bold mb-7 leading-[1.05] tracking-tight"
            >
              Ingliz tilini
              <br />
              <motion.span
                className="text-gradient inline-block"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{
                  backgroundSize: "200% 200%",
                  backgroundImage:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-purple)), hsl(var(--primary)))",
                }}
              >
                mukammal
              </motion.span>{" "}
              o'rganing
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              21+ o'yin, AI-powered testlar, Writing & Speaking baholash —
              barchasi bir platformada. IELTS va CEFR imtihonlariga
              tayyorlaning.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{
                  scale: 1.06,
                  boxShadow: "0 0 40px -8px hsl(var(--primary) / 0.5)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  handleStartTest();
                  fireConfetti();
                }}
                className="btn-primary flex items-center gap-2.5 text-base px-8 py-4 shadow-glow group"
              >
                <Rocket className="w-4 h-4 group-hover:animate-bounce" />
                {user ? "Testni Boshlash" : "Bepul Boshlash"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(user ? "/games" : "/login")}
                className="btn-outline flex items-center gap-2.5 text-base px-8 py-4"
              >
                <Gamepad2 className="w-4 h-4" />
                21+ O'yinlar
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10"
            >
              {[
                "Kredit karta shart emas",
                "21+ o'yin",
                "AI bilan tahlil",
                "Tezkor natijalar",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.a
          href="#stats"
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground/40" />
        </motion.a>
      </section>

      {/* ═══════════ LIVE STATS ═══════════ */}
      <section id="stats" className="py-16 border-b border-border/40 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto">
            {[
              {
                value: liveStats.users,
                suffix: "+",
                label: "Foydalanuvchilar",
                icon: Users,
              },
              {
                value: liveStats.tests,
                suffix: "+",
                label: "Testlar",
                icon: Target,
              },
              { value: 21, suffix: "+", label: "O'yinlar", icon: Gamepad2 },
              {
                value: liveStats.avgPass,
                suffix: "%",
                label: "Muvaffaqiyat",
                icon: Trophy,
              },
              { value: 4, suffix: ".9", label: "Reyting", icon: Star },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 mb-3 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Brands Marquee */}
      <section className="py-10 border-b border-border/30 overflow-hidden">
        <p className="text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-6 font-medium">
          Xalqaro til standartlariga mos
        </p>
        <MarqueeTicker
          items={[
            "IELTS",
            "TOEFL",
            "Cambridge",
            "Goethe",
            "DELF",
            "CEFR",
            "British Council",
            "ETS",
            "Pearson",
            "Trinity",
          ]}
          speed={25}
        />
      </section>

      {/* ═══════════ GAME SHOWCASE ═══════════ */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <FloatingParticles />
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">
              <Gamepad2 className="w-3.5 h-3.5" /> 21+ O'YINLAR
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight leading-tight">
              O'yin orqali <span className="text-gradient">o'rganing</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Duolingo'dan ham ko'proq o'yin — barchasi ingliz tilini
              o'rganishga qaratilgan
            </p>
          </FadeUp>

          <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto mb-10">
            {gameShowcase.map((game, i) => (
              <FadeUp key={i} delay={i * 0.02}>
                <motion.div
                  whileHover={{ scale: 1.08, y: -4 }}
                  className="px-4 py-2.5 rounded-2xl border border-border bg-card text-sm font-medium hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(user ? "/games" : "/login")}
                >
                  {game}
                </motion.div>
              </FadeUp>
            ))}
          </div>

          <FadeUp className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(user ? "/games" : "/login")}
              className="btn-primary px-8 py-3 text-sm shadow-glow"
            >
              <Gamepad2 className="w-4 h-4 mr-2 inline" /> Barcha o'yinlarni
              ko'rish
            </motion.button>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ FEATURES — 3D BENTO GRID ═══════════ */}
      <section id="features" className="py-28 lg:py-36 relative">
        <FloatingParticles />
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="text-center mb-20">
            <span className="premium-badge mb-4 inline-flex">IMKONIYATLAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight leading-tight">
              Muvaffaqiyat uchun{" "}
              <span className="text-gradient">barcha vositalar</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Har bir ko'nikma uchun maxsus tayyorlangan AI-powered testlar va
              tahlillar
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((feat, i) => (
              <FadeUp
                key={i}
                delay={i * 0.08}
                className={feat.large ? "lg:col-span-2" : ""}
              >
                <Card3D
                  className="card-elevated group p-7 lg:p-8 h-full cursor-default"
                  glowColor={feat.color}
                >
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.04] -translate-y-1/2 translate-x-1/2"
                    style={{
                      background: `radial-gradient(circle, hsl(${feat.color}), transparent 70%)`,
                    }}
                  />
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                      style={{ background: `hsl(${feat.color} / 0.1)` }}
                    >
                      <feat.icon
                        className="w-6 h-6"
                        style={{ color: `hsl(${feat.color})` }}
                      />
                    </div>
                    <h3 className="text-lg lg:text-xl font-display font-bold mb-2 tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                      {feat.desc}
                    </p>
                    {feat.pro && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 mt-4">
                        <Crown className="w-3 h-3" /> Pro
                      </span>
                    )}
                  </div>
                </Card3D>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPETITOR COMPARISON ═══════════ */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">
              <Trophy className="w-3.5 h-3.5" /> TAQQOSLASH
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Nima uchun <span className="text-gradient">Vokabi</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Boshqa platformalar bilan taqqoslang
            </p>
          </FadeUp>

          <FadeUp>
            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Xususiyat
                    </th>
                    <th className="p-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-bold text-primary">
                          Vokabi
                        </span>
                        <span className="text-[10px] text-primary/60">
                          ⭐ #1
                        </span>
                      </div>
                    </th>
                    <th className="p-3 text-center text-sm font-medium text-muted-foreground">
                      ScoreUp
                    </th>
                    <th className="p-3 text-center text-sm font-medium text-muted-foreground">
                      Self-Learn
                    </th>
                    <th className="p-3 text-center text-sm font-medium text-muted-foreground">
                      Duolingo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitorComparison.map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="border-t border-border/30"
                    >
                      <td className="p-3 text-sm font-medium">{row.feature}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                          {row.vokabi ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {row.scoreup ? (
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.selflearn ? (
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.duolingo ? (
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ LEVELS — 3D Cards ═══════════ */}
      <section id="levels" className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="container mx-auto px-4 relative">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">
              CEFR DARAJALAR
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight leading-tight">
              O'z <span className="text-gradient">darajangizni</span> tanlang
            </h2>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {levels.map((level, index) => {
              const colorMap: Record<string, string> = {
                A1: "142 76% 36%",
                A2: "173 80% 40%",
                B1: "45 93% 47%",
                B2: "25 95% 53%",
                C1: "358 84% 50%",
              };
              const c = colorMap[level.level] || "358 84% 50%";
              return (
                <FadeUp key={level.level} delay={index * 0.08}>
                  <Card3D
                    className="level-card text-center group size-full"
                    glowColor={c}
                  >
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      onClick={handleStartTest}
                      className="cursor-pointer"
                    >
                      <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border text-xl font-display font-bold mb-3 group-hover:scale-110 transition-transform duration-300"
                        style={{
                          background: `hsl(${c} / 0.1)`,
                          color: `hsl(${c})`,
                          borderColor: `hsl(${c} / 0.2)`,
                        }}
                      >
                        {level.level}
                      </div>
                      <h3 className="text-base font-semibold mb-1">
                        {level.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {level.description}
                      </p>
                    </motion.div>
                  </Card3D>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">
              QANDAY ISHLAYDI
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Uchta oddiy <span className="text-gradient">qadam</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Darajangizni Tanlang",
                description:
                  "A1 dan C1 gacha o'z darajangizga mos testni tanlang",
                icon: Target,
                color: "217 91% 60%",
              },
              {
                step: "02",
                title: "Testni Yeching",
                description:
                  "AI-powered testlarni yeching va real-time feedback oling",
                icon: Zap,
                color: "358 84% 50%",
              },
              {
                step: "03",
                title: "Rivojlaning",
                description:
                  "AI tahlil asosida zaif tomonlaringiz ustida ishlang",
                icon: TrendingUp,
                color: "142 76% 42%",
              },
            ].map((item, index) => (
              <FadeUp key={index} delay={index * 0.15}>
                <Card3D
                  className="relative text-center group p-8 rounded-2xl border border-border/50 bg-card"
                  glowColor={item.color}
                >
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border/50 z-10" />
                  )}
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: `hsl(${item.color} / 0.1)` }}
                    whileHover={{
                      rotate: [0, -5, 5, 0],
                      transition: { duration: 0.5 },
                    }}
                  >
                    <item.icon
                      className="w-7 h-7"
                      style={{ color: `hsl(${item.color})` }}
                    />
                  </motion.div>
                  <div
                    className="text-[11px] font-bold mb-2 tracking-[0.2em]"
                    style={{ color: `hsl(${item.color})` }}
                  >
                    STEP {item.step}
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </Card3D>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="container mx-auto px-4 relative">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">NARXLAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Sizga mos <span className="text-gradient">rejani</span> tanlang
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <FadeUp delay={0}>
              <Card3D
                className="card-elevated p-8 h-full flex flex-col"
                glowColor="215 16% 47%"
              >
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Bepul
                </h4>
                <h3 className="text-4xl font-display font-bold tracking-tight mb-1">
                  $0
                </h3>
                <p className="text-sm text-muted-foreground mb-8">
                  Abadiy bepul
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Kuniga 3 ta test",
                    "Reading & Listening testlar",
                    "Lug'at & Grammatika testlar",
                    "21+ o'yin",
                    "Natijalar tarixi",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartTest}
                  className="w-full btn-outline py-3 text-sm mt-auto"
                >
                  {user ? "Testni Boshlash" : "Bepul Boshlash"}
                </motion.button>
              </Card3D>
            </FadeUp>

            <FadeUp delay={0.1}>
              <Card3D
                className="relative card-elevated p-8 h-full flex flex-col border-primary/30 bg-primary/[0.02]"
                glowColor="358 84% 50%"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-glow">
                    <Crown className="w-3 h-3" /> Mashhur
                  </span>
                </div>
                <h4 className="text-sm font-medium text-primary mb-2">Pro</h4>
                <h3 className="text-4xl font-display font-bold tracking-tight mb-1">
                  Pro
                </h3>
                <p className="text-sm text-muted-foreground mb-8">
                  Admin tomonidan tayinlanadi
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Cheksiz testlar",
                    "AI tahlil & feedback",
                    "Video tavsiyalar",
                    "Writing AI baholash (9-ball)",
                    "Speaking AI tahlil",
                    "Sertifikat yuklab olish",
                    "Priority support",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.a
                  href="https://t.me/vokabi_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3 text-sm shadow-glow block text-center"
                >
                  📩 Adminga yozish (@vokabi_bot)
                </motion.a>
              </Card3D>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-28 lg:py-36 bg-secondary text-secondary-foreground relative overflow-hidden noise-overlay">
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-primary mb-4">
              IZOHLAR
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Foydalanuvchilar <span className="text-primary">fikrlari</span>
            </h2>
          </FadeUp>

          {user && (
            <FadeUp className="text-center mb-10">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackDialog(true)}
                className="border-primary/30 hover:bg-primary/10"
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" /> Fikr qoldirish
              </Button>
            </FadeUp>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {(feedbacks.length > 0
              ? feedbacks
              : [
                  {
                    full_name: "Aziza Karimova",
                    level_info: "B2 → IELTS 7.0",
                    message:
                      "AI tahlil funksiyasi juda kuchli — zaif tomonlarimni aniqlab, maxsus mashqlar tavsiya qildi. 3 oyda IELTS 7.0 oldim!",
                    rating: 5,
                  },
                  {
                    full_name: "Sardor Rahimov",
                    level_info: "B1 → C1",
                    message:
                      "Speaking practice AI bilan juda qulay. Har kuni mashq qildim va 6 oyda B1 dan C1 ga o'tdim.",
                    rating: 5,
                  },
                  {
                    full_name: "Malika Usmanova",
                    level_info: "A2 → B2",
                    message:
                      "Bepul versiyasi ham juda foydali, lekin Pro olganidan keyin AI writing baholash hayotimni o'zgartirdi.",
                    rating: 5,
                  },
                ]
            ).map((fb: any, index: number) => {
              const initials =
                fb.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() || "??";
              return (
                <FadeUp key={fb.id || index} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="rounded-2xl p-7 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] h-full hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-sm text-primary">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {fb.full_name}
                        </div>
                        {fb.level_info && (
                          <div className="text-xs text-secondary-foreground/50">
                            {fb.level_info}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(fb.rating || 5)].map((_: any, i: number) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <p className="text-secondary-foreground/60 text-sm leading-relaxed">
                      {fb.message}
                    </p>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
      />

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-28 lg:py-36">
        <div className="container mx-auto px-4">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">SAVOL-JAVOB</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Ko'p beriladigan <span className="text-gradient">savollar</span>
            </h2>
          </FadeUp>

          <div className="max-w-2xl mx-auto space-y-3">
            {[
              {
                q: "CEFR nima?",
                a: "CEFR — tillarni bilish darajasini belgilovchi xalqaro standart. A1 dan C2 gacha 6 ta daraja mavjud.",
              },
              {
                q: "Qanday turdagi testlar mavjud?",
                a: "6 xil test turi mavjud: Lug'at, Grammatika, Reading, Listening, Writing va Speaking.",
              },
              {
                q: "Nechta o'yin bor?",
                a: "21+ o'yin mavjud: Word Match, Spelling Bee, Grammar Battle, Crossword, Memory Cards, Tongue Twisters va boshqalar.",
              },
              {
                q: "Pro versiya nimalar beradi?",
                a: "Cheksiz testlar, AI tahlil, writing/speaking AI baholash, sertifikat va batafsil statistika.",
              },
              {
                q: "Pro qanday olsa bo'ladi?",
                a: "Telegram botimizga yozing: @vokabi_bot",
              },
              {
                q: "AI tahlil qanday ishlaydi?",
                a: "Sun'iy intellekt natijalaringizni tahlil qilib, zaif tomonlaringizni aniqlaydi va shaxsiy reja tuzadi.",
              },
            ].map((faq, index) => (
              <FadeUp key={index} delay={index * 0.04}>
                <details className="group card-elevated cursor-pointer p-5">
                  <summary className="flex items-center justify-between font-display font-semibold text-[15px] list-none">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform duration-300 flex-shrink-0 ml-4" />
                  </summary>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TELEGRAM CTA ═══════════ */}
      <section className="py-20 border-t border-border/30">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8 p-8 rounded-3xl border border-primary/20 bg-primary/[0.02]">
              <div className="text-5xl">📱</div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-display font-bold mb-2">
                  Telegram kanalimizga qo'shiling!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Yangiliklar, maslahatlar va maxsus takliflar — @vokabi
                </p>
              </div>
              <div className="flex gap-3">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href="https://t.me/vokabi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  📢 Kanal
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href="https://t.me/vokabi_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline px-6 py-2.5 text-sm"
                >
                  🤖 Bot
                </motion.a>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 noise-overlay" />
        <FloatingParticles />
        <div className="container mx-auto px-4 text-center relative z-10">
          <FadeUp>
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <GraduationCap className="w-16 h-16 mx-auto mb-6 text-white/80" />
              <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold text-white mb-5 tracking-tight">
                Created by{" "}
                <Link
                  to="https://t.me/a_karimboyev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Akmal Karimboyev
                </Link>
              </h2>
              <p className="text-white/75 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                Minglab o'quvchilar bilan birga IELTS va CEFR sertifikatiga
                tayyorlaning
              </p>
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  handleStartTest();
                  fireConfetti();
                }}
                className="inline-flex items-center gap-2.5 bg-white text-foreground font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/95 transition-colors shadow-xl border-2 border-white"
              >
                {user ? "Testni Boshlash" : "Bepul Ro'yxatdan O'tish"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
};
