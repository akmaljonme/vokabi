import {
  ArrowRight,
  Clock,
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
import { useRef, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { supabase as _sbClient } from "@/integrations/supabase/client";
const supabase: any = _sbClient;
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { CertificateScene3D } from "@/components/CertificateScene3D";
import { Scene3DStats } from "@/components/Scene3DStats";
import { HowItWorks3D } from "@/components/HowItWorks3D";
import { Tilt3DCard } from "@/components/Tilt3DCard";
import type { Feedback } from "@/types/cefr";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useIsMobile } from "@/hooks/use-mobile";

let __isMobileGlobal = false;

/* ─── Startup-Fest style wavy chunky heading ─── */
const WavyHeading = ({
  text,
  className = "",
  amber = false,
  curve = 6,
  delayBase = 0,
}: {
  text: string;
  className?: string;
  amber?: boolean;
  curve?: number;
  delayBase?: number;
}) => {
  const letters = Array.from(text);
  const mid = (letters.length - 1) / 2;
  return (
    <span
      className={`sf-chunky ${amber ? "sf-chunky-amber" : ""} ${className}`}
      aria-label={text}
    >
      {letters.map((ch, i) => {
        const t = mid === 0 ? 0 : (i - mid) / mid; // -1..1
        const rotate = t * curve; // slight curve
        const yOffset = -Math.cos(t * Math.PI * 0.5) * 8; // arc upward in middle
        return (
          <motion.span
            key={i}
            className="sf-letter"
            initial={{ opacity: 0, y: 40, rotate: rotate * 2 }}
            animate={{ opacity: 1, y: yOffset, rotate }}
            transition={{
              duration: 0.7,
              delay: delayBase + i * 0.035,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: yOffset - 8, scale: 1.08 }}
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        );
      })}
    </span>
  );
};

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

/* ─── Floating 3D Items ─── */
/* ─── Subtle floating particles (background ambiance only) ─── */
const FloatingParticles = () => {
  if (__isMobileGlobal) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute rounded-full"
          style={{
            width: i % 3 === 0 ? 6 : 4,
            height: i % 3 === 0 ? 6 : 4,
            background: i % 2 === 0
              ? `hsl(var(--primary) / 0.2)`
              : `rgba(72, 217, 164, 0.15)`,
            left: `${8 + i * 7}%`,
            top: `${15 + (i % 4) * 20}%`,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 5 + i * 0.6, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

/* ─── Custom Cursor Trailer ─── */
const CursorTrailer = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Skip on touch / mobile — otherwise the two dots get stuck at 0,0
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (isTouch || window.innerWidth < 1024) return;
    const cursor = document.createElement('div');
    const trail = document.createElement('div');
    cursor.id = 'vk-cursor';
    trail.id = 'vk-cursor-trail';
    Object.assign(cursor.style, {
      position: 'fixed', width: '16px', height: '16px', borderRadius: '50%',
      background: 'hsl(88 78% 45% / 0.7)', pointerEvents: 'none',
      zIndex: '9999', transform: 'translate(-50%,-50%)',
      transition: 'width 0.3s, height 0.3s',
    });
    Object.assign(trail.style, {
      position: 'fixed', width: '36px', height: '36px', borderRadius: '50%',
      border: '2px solid hsl(88 78% 45% / 0.35)', pointerEvents: 'none',
      zIndex: '9998', transform: 'translate(-50%,-50%)',
      transition: 'left 0.12s ease, top 0.12s ease',
    });
    document.body.appendChild(cursor);
    document.body.appendChild(trail);
    let mx = 0, my = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      setTimeout(() => { trail.style.left = mx + 'px'; trail.style.top = my + 'px'; }, 80);
    };
    document.addEventListener('mousemove', move);
    return () => {
      document.removeEventListener('mousemove', move);
      cursor.remove(); trail.remove();
    };
  }, []);
  return null;
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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
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
      // Try RPC first
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
      } else {
        // Fallback: direct count from profiles/test_results
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        const { count: testCount } = await supabase
          .from("test_results")
          .select("*", { count: "exact", head: true });
        setLiveStats({
          users: userCount || 0,
          tests: testCount || 0,
          avgPass: 95,
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
      if (data) setFeedbacks(data as unknown as Feedback[]);
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
    <>
    <CursorTrailer />
    <div className="overflow-x-clip relative z-10">
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
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="sf-hero-card px-6 sm:px-10 py-14 sm:py-20 lg:py-24"
            >
              {/* Floating decorative blobs */}
              <motion.div
                aria-hidden
                className="sf-blob absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, #fff, transparent 70%)" }}
              />
              <motion.div
                aria-hidden
                className="sf-blob absolute -bottom-16 -right-12 w-56 h-56 rounded-full opacity-25"
                style={{ background: "radial-gradient(circle, hsl(45 100% 75%), transparent 70%)", animationDelay: "1.2s" }}
              />
              {/* Sparkle star */}
              <div aria-hidden className="absolute top-8 right-8 hidden sm:block">
                <div className="relative">
                  <Sparkles className="w-10 h-10 text-yellow-200 sf-spin-slow" />
                  <span className="absolute inset-0 rounded-full bg-yellow-200/40 sf-pulse-ring" />
                </div>
              </div>
              <div aria-hidden className="absolute bottom-10 left-6 hidden sm:block">
                <Star className="w-7 h-7 text-white/70 sf-spin-slow" style={{ animationDuration: "22s" }} />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-8"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI-Powered • IELTS • CEFR
                </motion.div>

                <div className="mb-8 sm:mb-10">
                  <h1 className="text-[1.75rem] sm:text-5xl md:text-6xl lg:text-[5rem] font-display mb-2 sm:mb-3">
                    <WavyHeading text="INGLIZ TILINI" curve={5} />
                  </h1>
                  <h1 className="text-[1.75rem] sm:text-5xl md:text-6xl lg:text-[5rem] font-display">
                    <WavyHeading text="MUKAMMAL" curve={4} delayBase={0.2} />
                  </h1>
                  <h1 className="text-[1.75rem] sm:text-5xl md:text-6xl lg:text-[5rem] font-display">
                    <WavyHeading text="O'RGANING" curve={4} delayBase={0.4} />
                  </h1>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.9 }}
                  className="text-white/90 max-w-2xl text-sm sm:text-lg leading-relaxed font-semibold mb-10 px-2"
                >
                  <span className="font-extrabold">Vokabi</span> — 21+ o'yin, AI-powered testlar va Writing & Speaking baholashni bitta platformada birlashtirgan o'quv festivali. Bilimingizni real darajaga aylantiring.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.05, type: "spring", stiffness: 180 }}
                  className="flex flex-col sm:flex-row items-center gap-4"
                >
                  <motion.button
                    whileHover={{ y: -3 }}
                    whileTap={{ y: 2 }}
                    onClick={() => { handleStartTest(); fireConfetti(); }}
                    className="bg-white text-[hsl(217_91%_42%)] px-9 py-4 rounded-full font-display font-extrabold text-base sm:text-lg inline-flex items-center gap-2.5 transition-transform"
                    style={{ boxShadow: "0 6px 0 0 hsl(217 91% 28%)" }}
                  >
                    <Rocket className="w-5 h-5" />
                    {user ? "Testni Boshlash" : "Ro'yxatdan o'tish"}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -3 }}
                    whileTap={{ y: 2 }}
                    onClick={() => navigate(user ? "/games" : "/login")}
                    className="bg-[hsl(45_100%_55%)] text-[hsl(28_95%_25%)] px-9 py-4 rounded-full font-display font-extrabold text-base sm:text-lg inline-flex items-center gap-2.5 transition-transform border-2 border-[hsl(28_95%_45%)]"
                    style={{ boxShadow: "0 6px 0 0 hsl(28 95% 38%)" }}
                  >
                    <Gamepad2 className="w-5 h-5" />
                    21+ O'yin
                  </motion.button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10"
                >
                  {["Bepul start", "AI tahlil", "21+ o'yin", "CEFR sertifikat"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-white/85 text-xs sm:text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4 text-yellow-200" />
                      {t}
                    </div>
                  ))}
                </motion.div>
              </div>
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

      {/* ═══════════ SF: BIZ HAQIMIZDA ═══════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 sf-dot-bg opacity-60" aria-hidden />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-5xl sm:text-7xl lg:text-8xl sf-section-heading">
                BIZ<br/>HAQIMIZDA
              </h2>
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-[hsl(45_100%_55%)] sf-spin-slow shrink-0 ml-auto" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="sf-card-blue px-6 sm:px-12 py-12 sm:py-16"
            >
              <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-display font-extrabold mb-5 leading-tight">
                    <span className="font-extrabold">Vokabi</span> — o'zbek o'quvchilari uchun ingliz tilini mukammal o'rganish platformasi.
                  </h3>
                  <p className="text-white/90 text-base sm:text-lg leading-relaxed font-semibold">
                    Biz an'anaviy darsliklarni AI texnologiyalari bilan birlashtirib, har bir o'quvchiga o'z darajasiga mos shaxsiy yo'lni taqdim etamiz. CEFR standarti, 21+ interaktiv o'yin, real Writing & Speaking baholash — barchasi bitta joyda.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { n: liveStats.users > 0 ? `${liveStats.users.toLocaleString()}+` : "—", l: "Faol o'quvchi" },
                    { n: "21+", l: "O'yin va test" },
                    { n: "6", l: "CEFR daraja" },
                    { n: "24/7", l: "AI yordamchi" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="bg-white/15 backdrop-blur-sm border-2 border-white/30 rounded-2xl px-4 py-5 text-center"
                      style={{ boxShadow: "0 6px 0 0 hsl(217 91% 28%)" }}
                    >
                      <div className="text-3xl sm:text-4xl sf-pill-num mb-1">{s.n}</div>
                      <div className="text-white/85 text-xs sm:text-sm font-bold uppercase tracking-wide">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ SF: IMKONIYATLAR ═══════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 sf-dot-bg-amber opacity-50" aria-hidden />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <Star className="w-12 h-12 sm:w-16 sm:h-16 text-[hsl(217_91%_55%)] sf-spin-slow shrink-0" />
              <h2 className="text-5xl sm:text-7xl lg:text-8xl sf-section-heading sf-section-heading-blue text-right ml-auto">
                IMKONI-<br/>YATLAR
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Brain, title: "AI Tahlil", desc: "Writing va Speaking javoblaringizni AI bir necha soniyada CEFR bo'yicha baholaydi.", color: "blue" },
                { icon: Gamepad2, title: "21+ O'yin", desc: "So'z, grammatika va tinglash o'yinlari — o'rganishni o'yinga aylantiring.", color: "amber" },
                { icon: Award, title: "CEFR Sertifikat", desc: "Test natijalari bo'yicha avtomatik PNG sertifikat — yuklab oling va ulashing.", color: "blue" },
                { icon: Video, title: "Video Darslar", desc: "Tanlangan o'quv videolari — har bir CEFR darajasi uchun moslangan.", color: "amber" },
                { icon: Bot, title: "AI Tutor", desc: "24/7 sun'iy intellekt yordamchisi — har qanday savolingizga javob.", color: "blue" },
                { icon: Trophy, title: "Oylik Turnir", desc: "Har oy musobaqada qatnashing — 1-o'rin 200,000 so'm, 2-o'rin 1 yillik Pro obuna!", color: "amber" },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  className={`${f.color === "blue" ? "sf-card-blue" : "sf-card-amber"} p-7 sm:p-8 relative`}
                >
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center mb-5"
                         style={{ boxShadow: `0 5px 0 0 ${f.color === "blue" ? "hsl(217 91% 28%)" : "hsl(28 95% 32%)"}` }}>
                      <f.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-display font-extrabold mb-2 text-white">{f.title}</h3>
                    <p className="text-white/90 text-sm sm:text-base font-semibold leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SF: BOSQICHLAR ═══════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 sf-dot-bg opacity-60" aria-hidden />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <h2 className="text-5xl sm:text-7xl lg:text-8xl sf-section-heading">
                BOSQICHLAR
              </h2>
              <Rocket className="w-12 h-12 sm:w-16 sm:h-16 text-[hsl(28_95%_55%)] sf-spin-slow shrink-0 ml-auto" style={{ animationDuration: "24s" }} />
            </div>

            <div className="space-y-5">
              {[
                { n: "01", t: "Ro'yxatdan o'ting", d: "Bir necha soniyada hisob yarating va darajangizni tanlang." },
                { n: "02", t: "Joriy darajangizni aniqlang", d: "Qisqa CEFR placement test bilan A1 dan C2 gacha darajangizni belgilang." },
                { n: "03", t: "O'yinlar va testlar bilan o'rganing", d: "Har kuni 15 daqiqa — 21+ o'yin, AI Tutor va video darslar yordamida." },
                { n: "04", t: "Sertifikat oling", d: "Yakuniy testdan o'tib, rasmiy CEFR sertifikatingizni yuklab oling." },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`${i % 2 === 0 ? "sf-card-blue" : "sf-card-amber"} px-6 sm:px-10 py-7 sm:py-9`}
                >
                  <div className="relative z-10 flex items-center gap-5 sm:gap-8">
                    <div className="text-5xl sm:text-7xl sf-pill-num shrink-0"
                         style={{ WebkitTextStroke: i % 2 === 0 ? "2px hsl(217 91% 30%)" : "2px hsl(28 95% 32%)" }}>
                      {step.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white mb-1">{step.t}</h3>
                      <p className="text-white/90 text-sm sm:text-base font-semibold">{step.d}</p>
                    </div>
                    <ArrowRight className="w-7 h-7 text-white/80 shrink-0 hidden sm:block" />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-12"
            >
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ y: 2 }}
                onClick={() => { handleStartTest(); fireConfetti(); }}
                className="bg-[hsl(217_91%_50%)] text-white px-10 py-5 rounded-full font-display font-extrabold text-lg inline-flex items-center gap-3"
                style={{ boxShadow: "0 7px 0 0 hsl(217 91% 30%)" }}
              >
                <Rocket className="w-6 h-6" />
                Hozir boshlash
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ LIVE STATS ═══════════ */}
      <section id="stats" className="py-16 border-b border-border/40 relative overflow-hidden">
        {/* 3D decoration background */}
        {!isMobile && (
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <Scene3DStats />
          </div>
        )}
        <div className="container mx-auto px-4 relative z-10">
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
                label: "O'tish darajasi",
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
            <span className="premium-badge mb-5 inline-flex">
              <Gamepad2 className="w-3.5 h-3.5" /> 21+ O'YINLAR
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-4 tracking-tight leading-[1.15] text-balance px-2">
              O'yin orqali <span className="text-gradient">o'rganing</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto text-balance px-4">
              Duolingo'dan ham ko'proq o'yin — barchasi ingliz tilini o'rganishga qaratilgan
            </p>
          </FadeUp>

          <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto mb-12">
            {gameShowcase.map((game, i) => (
              <FadeUp key={i} delay={i * 0.02}>
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 2 }}
                  onClick={() => navigate(user ? "/games" : "/login")}
                  className="px-4 py-2.5 rounded-2xl text-sm font-extrabold text-white inline-flex items-center gap-2 transition-transform"
                  style={{
                    background: game.bg,
                    border: `2px solid ${game.shadow}`,
                    boxShadow: `0 4px 0 0 ${game.shadow}`,
                  }}
                >
                  <span className="text-base leading-none">{game.emoji}</span>
                  <span>{game.label}</span>
                </motion.button>
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
          <FadeUp className="mb-16">
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-display font-black text-[clamp(36px,6vw,80px)] leading-none tracking-tight text-primary" style={{WebkitTextStroke:'2px hsl(var(--primary))', color:'transparent'}}>
                IMKONIYATLAR
              </h2>
              <span className="text-[clamp(28px,4vw,60px)] text-primary opacity-70 mt-2">↗</span>
            </div>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">
              Har bir ko'nikma uchun maxsus tayyorlangan AI-powered testlar va tahlillar
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((feat, i) => (
              <FadeUp
                key={i}
                delay={i * 0.08}
                className={feat.large ? "lg:col-span-2" : ""}
              >
                <Tilt3DCard
                  className="card-elevated group p-7 lg:p-8 h-full cursor-default rounded-2xl"
                  glowColor={`hsl(${feat.color})`}
                  intensity={8}
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
                </Tilt3DCard>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPETITOR COMPARISON ═══════════ */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="mb-16">
            <h2 className="font-display font-black text-[clamp(48px,8vw,100px)] leading-none tracking-tight mb-4" style={{WebkitTextStroke:'2px hsl(var(--primary))', color:'transparent'}}>
              NIMA UCHUN<br/>VOKABI?
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">
              Boshqa platformalar bilan taqqoslang
            </p>
          </FadeUp>

          <FadeUp>
            {/* Mobile: card view */}
            <div className="block sm:hidden max-w-sm mx-auto space-y-3">
              {competitorComparison.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  viewport={{ once: true }}
                  className="card-elevated rounded-xl p-4 border border-border/50"
                >
                  <p className="text-sm font-semibold mb-3">{row.feature}</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Vokabi", val: row.vokabi, primary: true },
                      { label: "ScoreUp", val: row.scoreup, primary: false },
                      { label: "Self-Learn", val: row.selflearn, primary: false },
                      { label: "Duolingo", val: row.duolingo, primary: false },
                    ].map(({ label, val, primary }) => (
                      <div key={label}>
                        <p className={`text-[10px] mb-1 font-medium ${primary ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
                        {val ? (
                          <CheckCircle2 className={`w-4 h-4 mx-auto ${primary ? "text-primary" : "text-muted-foreground/50"}`} />
                        ) : (
                          <span className="text-muted-foreground/30 text-sm">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop: table view */}
            <div className="hidden sm:block max-w-4xl mx-auto overflow-x-auto rounded-2xl border border-border/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground bg-muted/30">Xususiyat</th>
                    <th className="p-4 text-center bg-primary/5">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-bold text-primary">Vokabi</span>
                        <span className="text-[10px] text-primary/60">⭐ #1</span>
                      </div>
                    </th>
                    <th className="p-4 text-center text-sm font-medium text-muted-foreground bg-muted/30">ScoreUp</th>
                    <th className="p-4 text-center text-sm font-medium text-muted-foreground bg-muted/30">Self-Learn</th>
                    <th className="p-4 text-center text-sm font-medium text-muted-foreground bg-muted/30">Duolingo</th>
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
                      className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4 text-sm font-medium">{row.feature}</td>
                      <td className="p-4 text-center bg-primary/[0.03]">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                          {row.vokabi ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {row.scoreup ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        {row.selflearn ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        {row.duolingo ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
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
            <span className="premium-badge mb-5 inline-flex">CEFR DARAJALAR</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-4 tracking-tight leading-[1.15] text-balance px-2">
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
        {/* 3D node decoration */}
        {!isMobile && (
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{ height: 200, top: "50%", transform: "translateY(-50%)" }}>
            <HowItWorks3D />
          </div>
        )}
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="mb-16">
            <div className="flex items-start justify-between">
              <h2 className="font-display font-black text-[clamp(44px,7vw,90px)] leading-none tracking-tight text-foreground">
                QANDAY<br/>ISHLAYDI?
              </h2>
              <span className="text-[clamp(32px,5vw,60px)] text-primary mt-2">✦</span>
            </div>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mt-4 leading-relaxed">
              Uchta oddiy qadam bilan boshlang
            </p>
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
          <FadeUp className="mb-16">
            <h2 className="font-display font-black text-[clamp(52px,9vw,110px)] leading-none tracking-tight" style={{WebkitTextStroke:'2px hsl(var(--primary))', color:'transparent'}}>
              NARXLAR
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mt-3 leading-relaxed">
              Sizga mos rejani tanlang — bepuldan boshlang
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* FREE */}
            <FadeUp delay={0}>
              <Card3D className="card-elevated p-7 h-full flex flex-col" glowColor="215 16% 47%">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Bepul</h4>
                <h3 className="text-4xl font-display font-bold tracking-tight mb-1">$0</h3>
                <p className="text-sm text-muted-foreground mb-6">Abadiy bepul</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {["Kuniga 3 ta test", "Reading & Listening", "Lug'at & Grammatika", "21+ o'yin", "Natijalar tarixi"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleStartTest} className="w-full btn-outline py-3 text-sm mt-auto">
                  {user ? "Testni Boshlash" : "Bepul Boshlash"}
                </motion.button>
              </Card3D>
            </FadeUp>

            {/* 1 OY */}
            <FadeUp delay={0.1}>
              <Card3D className="card-elevated p-7 h-full flex flex-col" glowColor="358 84% 50%">
                <h4 className="text-sm font-medium text-primary mb-2">Pro · 1 oy</h4>
                <h3 className="text-4xl font-display font-bold tracking-tight mb-1">$1.99</h3>
                <p className="text-sm text-muted-foreground mb-6">$1.99/oy</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {["Cheksiz testlar", "AI tahlil & feedback", "Writing AI baholash", "Speaking AI tahlil", "Sertifikat yuklab olish"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/pricing")} className="w-full btn-outline py-3 text-sm mt-auto">
                  Sotib olish
                </motion.button>
              </Card3D>
            </FadeUp>

            {/* 6 OY */}
            <FadeUp delay={0.2}>
              <Card3D className="relative card-elevated p-7 h-full flex flex-col border-primary/30 bg-primary/[0.02]" glowColor="358 84% 50%">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-glow">
                    <Crown className="w-3 h-3" /> Mashhur
                  </span>
                </div>
                <h4 className="text-sm font-medium text-primary mb-2">Pro · 6 oy</h4>
                <h3 className="text-4xl font-display font-bold tracking-tight mb-1">$5.99</h3>
                <p className="text-sm text-muted-foreground mb-6">$1.00/oy · 50% tejash</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {["Cheksiz testlar", "AI tahlil & feedback", "Writing AI baholash", "Speaking AI tahlil", "Sertifikat yuklab olish"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/pricing")} className="w-full btn-primary py-3 text-sm shadow-glow mt-auto">
                  Sotib olish
                </motion.button>
              </Card3D>
            </FadeUp>

            {/* 1 YIL */}
            <FadeUp delay={0.3}>
              <Card3D className="card-elevated p-7 h-full flex flex-col" glowColor="358 84% 50%">
                <h4 className="text-sm font-medium text-primary mb-2">Pro · 1 yil</h4>
                <h3 className="text-4xl font-display font-bold tracking-tight mb-1">$10.99</h3>
                <p className="text-sm text-muted-foreground mb-6">$0.92/oy · 54% tejash</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {["Cheksiz testlar", "AI tahlil & feedback", "Writing AI baholash", "Speaking AI tahlil", "Sertifikat yuklab olish"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/pricing")} className="w-full btn-outline py-3 text-sm mt-auto">
                  Sotib olish
                </motion.button>
              </Card3D>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══════════ BLOG ═══════════ */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <FadeUp className="mb-12">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display font-black text-[clamp(36px,6vw,72px)] leading-none tracking-tight mb-3">
                  FOYDALI<br/>MAQOLALAR
                </h2>
                <p className="text-muted-foreground text-base max-w-md leading-relaxed">
                  IELTS, CEFR va ingliz tili haqida ekspertlar maslahati
                </p>
              </div>
              <a href="/blog" className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                Barchasi <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[
              { slug: "ielts-7-ball-olish", emoji: "🎯", title: "IELTS 7 ball olish uchun 30 kunlik reja", cat: "IELTS", time: 8 },
              { slug: "cefr-darajalari", emoji: "📊", title: "CEFR darajalari: A1 dan C2 gacha to'liq qo'llanma", cat: "CEFR", time: 6 },
              { slug: "ingliz-tili-orgatish-usullari", emoji: "🧠", title: "Ingliz tilini o'rganishning 7 ta samarali usuli", cat: "O'rganish", time: 7 },
            ].map((post, i) => (
              <FadeUp key={post.slug} delay={i * 0.1}>
                <a href={`/blog/${post.slug}`} className="block h-full">
                  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                    className="h-full rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all group">
                    <span className="text-4xl block mb-4">{post.emoji}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary mb-3 inline-block">{post.cat}</span>
                    <h3 className="font-display font-bold text-base mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                      <Clock className="w-3 h-3" />{post.time} daqiqa
                      <ArrowRight className="w-3.5 h-3.5 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                </a>
              </FadeUp>
            ))}
          </div>

          <div className="text-center sm:hidden">
            <a href="/blog" className="btn-outline inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              Barcha maqolalar <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-28 lg:py-36">
        <div className="container mx-auto px-4">
          <FadeUp className="mb-16">
            <div className="flex items-start justify-between">
              <h2 className="font-display font-black text-[clamp(52px,9vw,110px)] leading-none tracking-tight" style={{WebkitTextStroke:'2px hsl(var(--primary))', color:'transparent'}}>
                SAVOL<br/>JAVOB
              </h2>
              <span className="text-[clamp(32px,5vw,60px)] text-primary mt-2">?</span>
            </div>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mt-4 leading-relaxed">
              Ko'p beriladigan savollar
            </p>
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
                Created by <Link
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
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 bg-white text-gray-900 font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/95 transition-colors shadow-xl"
              >
                {user ? "Testni Boshlash" : "Bepul Ro'yxatdan O'tish"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </FadeUp>
        </div>
      </section>
    </div>
    </>
  );
};
