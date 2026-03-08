import { ArrowRight, BookOpen, Headphones, Award, Users, CheckCircle2, Star, ChevronDown, Zap, Globe, TrendingUp, Shield, Sparkles, Crown, Brain, BarChart3, Target, Mic, PenTool } from 'lucide-react';
import { levels } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LandingPageProps {
  onStartTest: () => void;
  onGoToVocabulary?: () => void;
}

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

export const LandingPage = ({ onStartTest, onGoToVocabulary }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState({ users: 0, tests: 0, avgPass: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.rpc('get_public_stats');
      if (data) {
        const stats = data as any;
        const passRate = stats.total_results > 0
          ? Math.round((stats.passed_results / stats.total_results) * 100)
          : 95;
        setLiveStats({
          users: stats.user_count || 0,
          tests: stats.test_count || 0,
          avgPass: passRate,
        });
      }
    };
    fetchStats();
  }, []);

  const handleStartTest = () => {
    if (user) onStartTest();
    else navigate('/auth');
  };

  return (
    <div>
      {/* Hero Section - Apple-inspired minimal */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        
        {/* Subtle gradient orbs */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="premium-badge mb-8 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Language Learning Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-display font-bold mb-7 leading-[1.05] tracking-tight"
            >
              Ingliz tilini
              <br />
              <span className="text-gradient">mukammal</span> o'rganing
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Sun'iy intellekt yordamida reading, listening, writing va speaking 
              ko'nikmalaringizni rivojlantiring. IELTS va CEFR imtihonlariga tayyorlaning.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartTest}
                className="btn-primary flex items-center gap-2.5 text-base px-8 py-4 shadow-glow"
              >
                {user ? 'Testni Boshlash' : 'Bepul Boshlash'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              {onGoToVocabulary && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => user ? onGoToVocabulary() : navigate('/auth')}
                  className="btn-outline flex items-center gap-2.5 text-base px-8 py-4"
                >
                  <BookOpen className="w-4 h-4" />
                  Lug'at Testlari
                </motion.button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
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
        </div>

        <motion.a
          href="#stats"
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground/40" />
        </motion.a>
      </section>

      {/* Social Proof Stats - Animated counters */}
      <section id="stats" className="py-16 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: liveStats.users, suffix: '+', label: 'Foydalanuvchilar' },
              { value: liveStats.tests, suffix: '+', label: 'Testlar' },
              { value: liveStats.avgPass, suffix: '%', label: 'Muvaffaqiyat' },
              { value: 4, suffix: '.9', label: 'Reyting' },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1} className="text-center">
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
            {['IELTS', 'TOEFL', 'Cambridge', 'Goethe', 'DELF'].map((brand) => (
              <span key={brand} className="text-xl font-display font-bold text-muted-foreground/20 tracking-tight hover:text-muted-foreground/40 transition-colors">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="py-28 lg:py-36">
        <div className="container mx-auto px-4">
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

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* Large card - AI Analysis */}
            <FadeUp delay={0} className="lg:col-span-2">
              <div className="card-elevated group p-8 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 tracking-tight">AI Tahlil & Tavsiyalar</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    Sun'iy intellekt natijalaringizni tahlil qiladi, zaif tomonlaringizni aniqlaydi va 
                    shaxsiy o'quv rejasini tuzadi. Video tavsiyalar va batafsil feedback olasiz.
                  </p>
                  <div className="flex items-center gap-2 mt-5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      <Crown className="w-3 h-3" /> Pro
                    </span>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Reading */}
            <FadeUp delay={0.08}>
              <div className="card-elevated group p-7 h-full">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">Reading</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">CEFR formatidagi matnlar va tahlil savollari</p>
              </div>
            </FadeUp>

            {/* Listening */}
            <FadeUp delay={0.12}>
              <div className="card-elevated group p-7 h-full">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">Listening</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Audio materiallar bilan tinglash ko'nikmasi</p>
              </div>
            </FadeUp>

            {/* Writing */}
            <FadeUp delay={0.16}>
              <div className="card-elevated group p-7 h-full">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <PenTool className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">Writing</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">IELTS 9-ballik tizimda AI baholash</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 mt-3">
                  <Crown className="w-2.5 h-2.5" /> Pro
                </span>
              </div>
            </FadeUp>

            {/* Speaking - large */}
            <FadeUp delay={0.2} className="lg:col-span-2">
              <div className="card-elevated group p-8 h-full relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/[0.03] rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Mic className="w-6 h-6 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 tracking-tight">Speaking Practice</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    Ovozingizni yozib oling, AI real-time tahlil qiladi. Fluency, pronunciation 
                    va grammar bo'yicha batafsil feedback oling.
                  </p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 mt-5">
                    <Crown className="w-3 h-3" /> Pro
                  </span>
                </div>
              </div>
            </FadeUp>

            {/* Grammar */}
            <FadeUp delay={0.24}>
              <div className="card-elevated group p-7 h-full">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">Grammatika</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Fe'l zamonlari va gap tuzilishi testlari</p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Levels Section */}
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
              const colors: Record<string, string> = {
                A1: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                A2: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
                B1: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                B2: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
                C1: 'bg-primary/10 text-primary border-primary/20',
              };
              return (
                <FadeUp key={level.level} delay={index * 0.08}>
                  <motion.button
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    onClick={handleStartTest}
                    className="level-card text-center group w-full"
                  >
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border ${colors[level.level]} text-xl font-display font-bold mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      {level.level}
                    </div>
                    <h3 className="text-base font-semibold mb-1">{level.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{level.description}</p>
                  </motion.button>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 lg:py-36">
        <div className="container mx-auto px-4">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">QANDAY ISHLAYDI</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Uchta oddiy <span className="text-gradient">qadam</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Darajangizni Tanlang', description: "A1 dan C1 gacha o'z darajangizga mos testni tanlang", icon: Target },
              { step: '02', title: 'Testni Yeching', description: "AI-powered testlarni yeching va real-time feedback oling", icon: Zap },
              { step: '03', title: "Rivojlaning", description: "AI tahlil asosida zaif tomonlaringiz ustida ishlang", icon: TrendingUp },
            ].map((item, index) => (
              <FadeUp key={index} delay={index * 0.1}>
                <div className="relative text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border/50 flex items-center justify-center mx-auto mb-6 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                    <item.icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-[11px] text-primary font-bold mb-2 tracking-[0.2em]">STEP {item.step}</div>
                  <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
              <div className="card-elevated p-8 h-full">
                <div className="text-sm font-medium text-muted-foreground mb-2">Bepul</div>
                <div className="text-4xl font-display font-bold tracking-tight mb-1">$0</div>
                <div className="text-sm text-muted-foreground mb-8">Abadiy bepul</div>
                
                <ul className="space-y-3 mb-8">
                  {[
                    'Kuniga 3 ta test',
                    'Reading & Listening testlar',
                    "Lug'at & Grammatika testlar",
                    'Natijalar tarixi',
                    'Asosiy statistika',
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
                  className="w-full btn-outline py-3 text-sm"
                >
                  {user ? 'Testni Boshlash' : 'Bepul Boshlash'}
                </motion.button>
              </div>
            </FadeUp>

            {/* Pro Plan */}
            <FadeUp delay={0.1}>
              <div className="relative card-elevated p-8 h-full border-primary/30 bg-primary/[0.02]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-glow">
                    <Crown className="w-3 h-3" /> Mashhur
                  </span>
                </div>
                
                <div className="text-sm font-medium text-primary mb-2">Pro</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-display font-bold tracking-tight">Pro</span>
                </div>
                <div className="text-sm text-muted-foreground mb-8">Admin tomonidan tayinlanadi</div>
                
                <ul className="space-y-3 mb-8">
                  {[
                    'Cheksiz testlar',
                    'AI tahlil & feedback',
                    'Video tavsiyalar',
                    'Writing AI baholash (9-ball)',
                    'Speaking AI tahlil',
                    'Sertifikat yuklab olish',
                    'Batafsil statistika',
                    'Priority support',
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
                  className="w-full btn-primary py-3 text-sm shadow-glow"
                >
                  Pro olish uchun bog'laning
                </motion.button>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 lg:py-36 bg-secondary text-secondary-foreground relative overflow-hidden noise-overlay">
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-primary mb-4">IZOHLAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold mb-5 tracking-tight">
              Foydalanuvchilar <span className="text-primary">fikrlari</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { name: 'Aziza Karimova', level: 'B2 → IELTS 7.0', text: "AI tahlil funksiyasi juda kuchli — zaif tomonlarimni aniqlab, maxsus mashqlar tavsiya qildi. 3 oyda IELTS 7.0 oldim!", avatar: 'AK' },
              { name: 'Sardor Rahimov', level: 'B1 → C1', text: "Speaking practice AI bilan juda qulay. Har kuni mashq qildim va 6 oyda B1 dan C1 ga o'tdim. Eng yaxshi platforma!", avatar: 'SR' },
              { name: 'Malika Usmanova', level: 'A2 → B2', text: "Bepul versiyasi ham juda foydali, lekin Pro olganidan keyin AI writing baholash va video tavsiyalar hayotimni o'zgartirdi.", avatar: 'MU' },
              { name: 'Bobur Aliyev', level: 'IELTS 8.0', text: "Boshqa platformalarni ham sinab ko'rdim, lekin IELTSify AI tahlili boshqalardan ancha ustun. Juda tavsiya qilaman!", avatar: 'BA' },
              { name: 'Nilufar Qodirova', level: 'B1 Sertifikat', text: "Mobil qurilmada ham mukammal ishlaydi. Metro'da, navbatda — har joyda mashq qildim. Interfeys juda qulay.", avatar: 'NQ' },
              { name: 'Jasur Toshmatov', level: 'C1 Sertifikat', text: "O'qituvchim tavsiya qildi. Grammatika testlari va AI feedback orqali xatolarimni tezda tushunib oldim.", avatar: 'JT' },
            ].map((testimonial, index) => (
              <FadeUp key={index} delay={index * 0.08}>
                <div className="rounded-2xl p-7 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] h-full hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-sm text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-secondary-foreground/50">{testimonial.level}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-secondary-foreground/60 text-sm leading-relaxed">{testimonial.text}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              { q: "Qanday turdagi testlar mavjud?", a: "6 xil test turi mavjud: Lug'at, Grammatika, Reading, Listening, Writing va Speaking. Har biri A1-C1 darajalar uchun tayyorlangan." },
              { q: 'Pro versiya nimalar beradi?', a: "Pro versiya cheksiz testlar, AI tahlil va feedback, writing/speaking AI baholash, video tavsiyalar, sertifikat yuklab olish va batafsil statistikani o'z ichiga oladi." },
              { q: 'Pro qanday olsa bo\'ladi?', a: "Pro versiya admin tomonidan tayinlanadi. Pro olish uchun biz bilan bog'laning." },
              { q: "AI tahlil qanday ishlaydi?", a: "Sun'iy intellekt natijalaringizni tahlil qilib, zaif tomonlaringizni aniqlaydi, video tavsiyalar beradi va shaxsiy o'quv reja tuzadi." },
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

      {/* Final CTA */}
      <section className="py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-rose-600" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl lg:text-[3.25rem] font-display font-bold text-white mb-5 tracking-tight">
              Kelajagingizga invest qiling
            </h2>
            <p className="text-white/75 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Minglab o'quvchilar bilan birga IELTS va CEFR sertifikatiga tayyorlaning
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartTest}
              className="inline-flex items-center gap-2.5 bg-white text-secondary font-bold text-base px-8 py-4 rounded-xl hover:bg-white/95 transition-colors shadow-xl"
            >
              {user ? 'Testni Boshlash' : "Bepul Ro'yxatdan O'tish"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </FadeUp>
        </div>
      </section>
    </div>
  );
};
