import { ArrowRight, BookOpen, Headphones, Award, Users, CheckCircle2, Star, ChevronDown, Zap, Globe, TrendingUp, Shield, Sparkles, Crown, Brain, BarChart3, Target, Mic, PenTool, MessageSquarePlus, Rocket, Trophy, GraduationCap } from 'lucide-react';
import { levels } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate, useScroll, useSpring, MotionValue } from 'framer-motion';
import { useRef, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface LandingPageProps {
  onStartTest: () => void;
  onGoToVocabulary?: () => void;
}

/* ─── Utility: Parallax wrapper ─── */
const useParallax = (value: MotionValue<number>, distance: number) => {
  return useTransform(value, [0, 1], [-distance, distance]);
};

/* ─── Fade-up on scroll ─── */
const FadeUp = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
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
const AnimatedCounter = ({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
      const unsub = rounded.on('change', (v) => setDisplay(v));
      return () => { controls.stop(); unsub(); };
    }
  }, [isInView, value]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
};

/* ─── 3D Tilt Card ─── */
const Card3D = ({ children, className = '', glowColor = 'var(--primary)' }: { children: React.ReactNode; className?: string; glowColor?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
        transition: 'transform 0.15s ease-out',
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Glow effect following cursor */}
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
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
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
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export const LandingPage = ({ onStartTest, onGoToVocabulary }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState({ users: 0, tests: 0, avgPass: 0 });
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 150]), { stiffness: 100, damping: 30 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.rpc('get_public_stats');
      if (data) {
        const stats = data as any;
        const passRate = stats.total_results > 0 ? Math.round(stats.passed_results / stats.total_results * 100) : 95;
        setLiveStats({ users: stats.user_count || 0, tests: stats.test_count || 0, avgPass: passRate });
      }
    };
    const fetchFeedbacks = async () => {
      const { data } = await supabase.from('feedbacks' as any).select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(6);
      if (data) setFeedbacks(data as any[]);
    };
    fetchStats();
    fetchFeedbacks();
  }, []);

  const handleStartTest = () => {
    if (user) onStartTest();
    else navigate('/auth');
  };

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e11d48', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'],
    });
  }, []);

  const features = [
    { icon: Brain, title: 'AI Tahlil & Tavsiyalar', desc: "Sun'iy intellekt natijalaringizni tahlil qiladi, zaif tomonlaringizni aniqlaydi va shaxsiy o'quv rejasini tuzadi.", color: '358 84% 50%', large: true, pro: true },
    { icon: BookOpen, title: 'Reading', desc: "CEFR formatidagi matnlar va tahlil savollari", color: '217 91% 60%' },
    { icon: Headphones, title: 'Listening', desc: "Audio materiallar bilan tinglash ko'nikmasi", color: '45 93% 47%' },
    { icon: PenTool, title: 'Writing', desc: "IELTS 9-ballik tizimda AI baholash", color: '142 76% 42%', pro: true },
    { icon: Mic, title: 'Speaking Practice', desc: "Ovozingizni yozib oling, AI real-time tahlil qiladi. Fluency, pronunciation va grammar bo'yicha batafsil feedback.", color: '270 76% 55%', large: true, pro: true },
    { icon: Zap, title: 'Grammatika', desc: "Fe'l zamonlari va gap tuzilishi testlari", color: '358 84% 50%' },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <FloatingParticles />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, hsl(var(--neon-purple)), transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
              className="premium-badge mb-8 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Language Learning Platform</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-display font-bold mb-7 leading-[1.05] tracking-tight"
            >
              Ingliz tilini
              <br />
              <motion.span
                className="text-gradient inline-block"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%', backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-purple)), hsl(var(--primary)))' }}
              >
                mukammal
              </motion.span>{' '}
              o'rganing
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Sun'iy intellekt yordamida reading, listening, writing va speaking
              ko'nikmalaringizni rivojlantiring. IELTS va CEFR imtihonlariga tayyorlaning.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: '0 0 40px -8px hsl(var(--primary) / 0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { handleStartTest(); fireConfetti(); }}
                className="btn-primary flex items-center gap-2.5 text-base px-8 py-4 shadow-glow group"
              >
                <Rocket className="w-4 h-4 group-hover:animate-bounce" />
                {user ? 'Testni Boshlash' : 'Bepul Boshlash'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              {onGoToVocabulary && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => (user ? onGoToVocabulary() : navigate('/auth'))}
                  className="btn-outline flex items-center gap-2.5 text-base px-8 py-4"
                >
                  <BookOpen className="w-4 h-4" />
                  Lug'at Testlari
                </motion.button>
              )}
            </motion.div>

            {/* Trust pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10"
            >
              {['Kredit karta shart emas', 'AI bilan tahlil', 'Tezkor natijalar'].map((text) => (
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: liveStats.users, suffix: '+', label: 'Foydalanuvchilar', icon: Users },
              { value: liveStats.tests, suffix: '+', label: 'Testlar', icon: Target },
              { value: liveStats.avgPass, suffix: '%', label: 'Muvaffaqiyat', icon: Trophy },
              { value: 4, suffix: '.9', label: 'Reyting', icon: Star },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 mb-3 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 border-b border-border/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-6 font-medium">
            Xalqaro til standartlariga mos
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {['IELTS', 'TOEFL', 'Cambridge', 'Goethe', 'DELF'].map((brand, i) => (
              <motion.span
                key={brand}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-xl font-display font-bold text-muted-foreground/20 tracking-tight hover:text-muted-foreground/40 transition-colors cursor-default"
              >
                {brand}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES — 3D BENTO GRID ═══════════ */}
      <section id="features" className="py-28 lg:py-36 relative">
        <FloatingParticles />
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="text-center mb-20">
            <span className="premium-badge mb-4 inline-flex">IMKONIYATLAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight leading-tight">
              Muvaffaqiyat uchun{' '}
              <span className="text-gradient">barcha vositalar</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Har bir ko'nikma uchun maxsus tayyorlangan AI-powered testlar va tahlillar
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((feat, i) => (
              <FadeUp key={i} delay={i * 0.08} className={feat.large ? 'lg:col-span-2' : ''}>
                <Card3D className="card-elevated group p-7 lg:p-8 h-full cursor-default" glowColor={feat.color}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.04] -translate-y-1/2 translate-x-1/2"
                    style={{ background: `radial-gradient(circle, hsl(${feat.color}), transparent 70%)` }}
                  />
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                      style={{ background: `hsl(${feat.color} / 0.1)` }}
                    >
                      <feat.icon className="w-6 h-6" style={{ color: `hsl(${feat.color})` }} />
                    </div>
                    <h3 className="text-lg lg:text-xl font-display font-bold mb-2 tracking-tight">{feat.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-md">{feat.desc}</p>
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

      {/* ═══════════ LEVELS — 3D Cards ═══════════ */}
      <section id="levels" className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="container mx-auto px-4 relative">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">CEFR DARAJALAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight leading-tight">
              O'z <span className="text-gradient">darajangizni</span> tanlang
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Boshlang'ichdan ilg'orgacha — har bir daraja uchun maxsus testlar
            </p>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {levels.map((level, index) => {
              const colorMap: Record<string, string> = {
                A1: '142 76% 36%', A2: '173 80% 40%', B1: '45 93% 47%', B2: '25 95% 53%', C1: '358 84% 50%',
              };
              const c = colorMap[level.level] || '358 84% 50%';
              return (
                <FadeUp key={level.level} delay={index * 0.08}>
                  <Card3D className="level-card text-center group w-full" glowColor={c}>
                    <motion.div whileTap={{ scale: 0.96 }} onClick={handleStartTest} className="cursor-pointer">
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
                      <h3 className="text-base font-semibold mb-1">{level.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{level.description}</p>
                    </motion.div>
                  </Card3D>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS — Parallax ═══════════ */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">QANDAY ISHLAYDI</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Uchta oddiy <span className="text-gradient">qadam</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Darajangizni Tanlang', description: "A1 dan C1 gacha o'z darajangizga mos testni tanlang", icon: Target, color: '217 91% 60%' },
              { step: '02', title: 'Testni Yeching', description: "AI-powered testlarni yeching va real-time feedback oling", icon: Zap, color: '358 84% 50%' },
              { step: '03', title: 'Rivojlaning', description: "AI tahlil asosida zaif tomonlaringiz ustida ishlang", icon: TrendingUp, color: '142 76% 42%' },
            ].map((item, index) => (
              <FadeUp key={index} delay={index * 0.15}>
                <Card3D className="relative text-center group p-8 rounded-2xl border border-border/50 bg-card" glowColor={item.color}>
                  {/* Step connector line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border/50 z-10" />
                  )}
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300"
                    style={{ background: `hsl(${item.color} / 0.1)` }}
                    whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
                  >
                    <item.icon className="w-7 h-7" style={{ color: `hsl(${item.color})` }} />
                  </motion.div>
                  <div className="text-[11px] font-bold mb-2 tracking-[0.2em]" style={{ color: `hsl(${item.color})` }}>
                    STEP {item.step}
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
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
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Bepul boshlang, kerak bo'lganda Pro ga o'ting
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <FadeUp delay={0}>
              <Card3D className="card-elevated p-8 h-full" glowColor="215 16% 47%">
                <div className="text-sm font-medium text-muted-foreground mb-2">Bepul</div>
                <div className="text-4xl font-display font-bold tracking-tight mb-1">$0</div>
                <div className="text-sm text-muted-foreground mb-8">Abadiy bepul</div>
                <ul className="space-y-3 mb-8">
                  {['Kuniga 3 ta test', 'Reading & Listening testlar', "Lug'at & Grammatika testlar", 'Natijalar tarixi', 'Asosiy statistika'].map((f) => (
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
                  className="w-full btn-outline py-3 text-sm"
                >
                  {user ? 'Testni Boshlash' : 'Bepul Boshlash'}
                </motion.button>
              </Card3D>
            </FadeUp>

            {/* Pro Plan */}
            <FadeUp delay={0.1}>
              <Card3D className="relative card-elevated p-8 h-full border-primary/30 bg-primary/[0.02]" glowColor="358 84% 50%">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-glow">
                    <Crown className="w-3 h-3" /> Mashhur
                  </span>
                </div>
                <div className="text-sm font-medium text-primary mb-2">Pro</div>
                <div className="text-4xl font-display font-bold tracking-tight mb-1">Pro</div>
                <div className="text-sm text-muted-foreground mb-8">Admin tomonidan tayinlanadi</div>
                <ul className="space-y-3 mb-8">
                  {['Cheksiz testlar', 'AI tahlil & feedback', 'Video tavsiyalar', 'Writing AI baholash (9-ball)', 'Speaking AI tahlil', 'Sertifikat yuklab olish', 'Batafsil statistika', 'Priority support'].map((f) => (
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
                  className="w-full btn-primary py-3 text-sm shadow-glow"
                >
                  Pro olish uchun bog'laning
                </motion.button>
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
              <Button variant="outline" onClick={() => setShowFeedbackDialog(true)} className="border-primary/30 hover:bg-primary/10">
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Fikr qoldirish
              </Button>
            </FadeUp>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {(feedbacks.length > 0
              ? feedbacks
              : [
                  { full_name: 'Aziza Karimova', level_info: 'B2 → IELTS 7.0', message: "AI tahlil funksiyasi juda kuchli — zaif tomonlarimni aniqlab, maxsus mashqlar tavsiya qildi. 3 oyda IELTS 7.0 oldim!", rating: 5 },
                  { full_name: 'Sardor Rahimov', level_info: 'B1 → C1', message: "Speaking practice AI bilan juda qulay. Har kuni mashq qildim va 6 oyda B1 dan C1 ga o'tdim.", rating: 5 },
                  { full_name: 'Malika Usmanova', level_info: 'A2 → B2', message: "Bepul versiyasi ham juda foydali, lekin Pro olganidan keyin AI writing baholash hayotimni o'zgartirdi.", rating: 5 },
                ]
            ).map((fb: any, index: number) => {
              const initials = fb.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??';
              return (
                <FadeUp key={fb.id || index} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="rounded-2xl p-7 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] h-full hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-sm text-primary">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{fb.full_name}</div>
                        {fb.level_info && <div className="text-xs text-secondary-foreground/50">{fb.level_info}</div>}
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(fb.rating || 5)].map((_: any, i: number) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-secondary-foreground/60 text-sm leading-relaxed">{fb.message}</p>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      <FeedbackDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog} />

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
              { q: 'CEFR nima?', a: "CEFR — tillarni bilish darajasini belgilovchi xalqaro standart. A1 dan C2 gacha 6 ta daraja mavjud. Bizning platformamiz A1 dan C1 gacha testlarni qamrab oladi." },
              { q: 'Qanday turdagi testlar mavjud?', a: "6 xil test turi mavjud: Lug'at, Grammatika, Reading, Listening, Writing va Speaking. Har biri A1-C1 darajalar uchun tayyorlangan." },
              { q: 'Pro versiya nimalar beradi?', a: "Pro versiya cheksiz testlar, AI tahlil va feedback, writing/speaking AI baholash, video tavsiyalar, sertifikat yuklab olish va batafsil statistikani o'z ichiga oladi." },
              { q: "Pro qanday olsa bo'ladi?", a: 'Pro versiya admin tomonidan tayinlanadi. Pro olish uchun biz bilan bog\'laning.' },
              { q: 'AI tahlil qanday ishlaydi?', a: "Sun'iy intellekt natijalaringizni tahlil qilib, zaif tomonlaringizni aniqlaydi, video tavsiyalar beradi va shaxsiy o'quv reja tuzadi." },
              { q: 'Har bir test qancha vaqt oladi?', a: "Har bir test 30 daqiqaga mo'ljallangan — haqiqiy CEFR imtihon bo'limlari kabi. Test davomida sahifa fullscreen rejimda bo'ladi." },
            ].map((faq, index) => (
              <FadeUp key={index} delay={index * 0.04}>
                <details className="group card-elevated cursor-pointer p-5">
                  <summary className="flex items-center justify-between font-display font-semibold text-[15px] list-none">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform duration-300 flex-shrink-0 ml-4" />
                  </summary>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                </details>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-rose-600" />
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
                Created by Akmal
              </h2>
              <p className="text-white/75 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                Minglab o'quvchilar bilan birga IELTS va CEFR sertifikatiga tayyorlaning
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { handleStartTest(); fireConfetti(); }}
                className="inline-flex items-center gap-2.5 bg-white text-secondary font-bold text-base px-8 py-4 rounded-xl hover:bg-white/95 transition-colors shadow-xl"
              >
                {user ? 'Testni Boshlash' : "Bepul Ro'yxatdan O'tish"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
};
