import { ArrowRight, BookOpen, Headphones, Award, Users, CheckCircle2, Star, ChevronDown, Zap, Globe, TrendingUp, Shield, Play, Sparkles } from 'lucide-react';
import { levels } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

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
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const LandingPage = ({ onStartTest, onGoToVocabulary }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartTest = () => {
    if (user) onStartTest();
    else navigate('/auth');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-30" />
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, hsl(270 60% 55%), transparent 70%)' }}
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="premium-badge mb-8"
              >
                <Sparkles className="w-4 h-4" />
                <span>5+ foydalanuvchi ishonchini qozongan</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-display font-bold mb-6 leading-[1.1] tracking-tight"
              >
                Ingliz Tilini
                <br />
                Mukammal{' '}
                <span className="text-gradient">O'rganing</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed"
              >
                Lug'at, grammatika, reading va listening testlari bilan bilimingizni sinang.
                CEFR sertifikatingizga professional tayyorlaning.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row items-start gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartTest}
                  className="btn-primary flex items-center gap-2.5 text-base px-7 py-3.5 shadow-glow"
                >
                  {user ? 'Testni Boshlash' : 'Bepul Boshlash'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                {onGoToVocabulary && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => user ? onGoToVocabulary() : navigate('/auth')}
                    className="btn-outline flex items-center gap-2.5 text-base px-7 py-3.5"
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
                className="flex items-center gap-6 mt-8"
              >
                {['Kredit karta shart emas', 'Tezkor natijalar'].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-level-a1" />
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Content - Premium Stats */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, value: '500+', label: 'Testlar', gradient: 'from-emerald-500 to-teal-600' },
                  { icon: Users, value: '50K+', label: 'Foydalanuvchilar', gradient: 'from-blue-500 to-indigo-600' },
                  { icon: Award, value: '95%', label: 'Muvaffaqiyat', gradient: 'from-amber-500 to-orange-600' },
                  { icon: Globe, value: '4', label: 'Test Turi', gradient: 'from-primary to-pink-600' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="card-elevated p-6 group"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-3xl font-display font-bold mb-0.5 tracking-tight">{stat.value}</div>
                    <div className="text-muted-foreground text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.a
          href="#features"
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground/50" />
        </motion.a>
      </section>

      {/* Trust Badges */}
      <section className="py-10 border-b border-border/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 font-medium">
            Xalqaro til standartlariga mos
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {['IELTS', 'TOEFL', 'Cambridge', 'Goethe', 'DELF'].map((brand) => (
              <span key={brand} className="text-xl font-display font-bold text-muted-foreground/30 tracking-tight">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">IMKONIYATLAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-5 tracking-tight">
              Muvaffaqiyat Uchun{' '}
              <span className="text-gradient">Barcha Vositalar</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              CEFR sertifikatiga tayyorgarlik ko'rish uchun to'liq vositalar to'plami
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, title: "Lug'at Testlari", description: "So'z boyligingizni sinab ko'ring. Har bir daraja uchun maxsus tayyorlangan testlar.", gradient: 'from-emerald-500 to-teal-600' },
              { icon: Zap, title: 'Grammatika Testlari', description: "Grammatik qoidalarni mustahkamlang. Fe'l zamonlari va gap tuzilishi bo'yicha testlar.", gradient: 'from-violet-500 to-purple-600' },
              { icon: BookOpen, title: 'Reading Testlari', description: "CEFR formatidagi o'qish testlari. Matnlarni tahlil qilish qobiliyatingizni sinang.", gradient: 'from-blue-500 to-indigo-600' },
              { icon: Headphones, title: 'Listening Testlari', description: "Audio materiallar bilan tinglash qobiliyatingizni rivojlantiring.", gradient: 'from-amber-500 to-orange-600' },
              { icon: TrendingUp, title: "Natijalar Tahlili", description: "Har bir test bo'yicha batafsil natijalar va kamchiliklarni aniqlash.", gradient: 'from-pink-500 to-rose-600' },
              { icon: Shield, title: 'Ekspert Kontent', description: "Sertifikatlangan CEFR o'qituvchilari tomonidan tayyorlangan.", gradient: 'from-primary to-red-600' },
            ].map((feature, index) => (
              <FadeUp key={index} delay={index * 0.08}>
                <div className="card-elevated group p-7 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section id="levels" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="container mx-auto px-4 relative">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">CEFR DARAJALAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-5 tracking-tight">
              O'z <span className="text-gradient">Darajangizni</span> Tanlang
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Boshlang'ichdan ilg'orgacha — har bir daraja uchun maxsus testlar
            </p>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {levels.map((level, index) => {
              const gradients: Record<string, string> = {
                A1: 'from-emerald-400 to-emerald-600',
                A2: 'from-teal-400 to-teal-600',
                B1: 'from-amber-400 to-amber-600',
                B2: 'from-orange-400 to-orange-600',
                C1: 'from-red-400 to-red-600',
              };
              return (
                <FadeUp key={level.level} delay={index * 0.08}>
                  <motion.button
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    onClick={handleStartTest}
                    className="level-card text-center group w-full"
                  >
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradients[level.level]} text-white text-xl font-display font-bold mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
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
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">QANDAY ISHLAYDI</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-5 tracking-tight">
              Uchta Oddiy <span className="text-gradient">Qadam</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Darajangizni Tanlang', description: "A1 dan C1 gacha o'z darajangizga mos testni tanlang", icon: '🎯' },
              { step: '02', title: 'Testni Yeching', description: "Lug'at, grammatika, reading yoki listening testini yeching", icon: '📝' },
              { step: '03', title: "Natijani Ko'ring", description: "Natijalaringizni tahlil qiling va kamchiliklaringiz ustida ishlang", icon: '📈' },
            ].map((item, index) => (
              <FadeUp key={index} delay={index * 0.1}>
                <div className="relative text-center p-8 rounded-2xl bg-muted/30 border border-border/50">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="text-xs text-primary font-bold mb-2 tracking-widest">STEP {item.step}</div>
                  <h3 className="text-lg font-display font-semibold mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.3} className="text-center mt-12">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartTest}
              className="btn-primary inline-flex items-center gap-2.5 text-base px-7 py-3.5"
            >
              Hozir Boshlang
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </FadeUp>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32 bg-secondary text-secondary-foreground relative overflow-hidden noise-overlay">
        <div className="container mx-auto px-4 relative z-10">
          <FadeUp className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-primary mb-4">IZOHLAR</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-5 tracking-tight">
              Foydalanuvchilar <span className="text-primary">Fikrlari</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { name: 'Aziza Karimova', level: 'B2 Sertifikat', text: "Lug'at va grammatika testlari juda foydali bo'ldi. 3 oyda B2 imtihoniga to'liq tayyorlandim!", avatar: 'AK' },
              { name: 'Sardor Rahimov', level: 'C1 Sertifikat', text: "Tezkor natijalar va batafsil tushuntirishlar xatolarimni tushunishni osonlashtirdi. Juda tavsiya qilaman!", avatar: 'SR' },
              { name: 'Malika Usmanova', level: 'B1 Sertifikat', text: "Istalgan vaqtda, istalgan joyda mashq qilish mumkin. Mobil qurilmalar uchun qulay interfeys juda yoqdi.", avatar: 'MU' },
            ].map((testimonial, index) => (
              <FadeUp key={index} delay={index * 0.1}>
                <div className="rounded-2xl p-7 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center font-semibold text-sm text-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-xs text-secondary-foreground/60">{testimonial.level}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-secondary-foreground/70 text-sm leading-relaxed">{testimonial.text}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <FadeUp className="text-center mb-16">
            <span className="premium-badge mb-4 inline-flex">SAVOL-JAVOB</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-5 tracking-tight">
              Ko'p Beriladigan <span className="text-gradient">Savollar</span>
            </h2>
          </FadeUp>

          <div className="max-w-2xl mx-auto space-y-3">
            {[
              { q: 'CEFR nima?', a: "CEFR — tillarni bilish darajasini belgilovchi xalqaro standart. A1 dan C2 gacha 6 ta daraja mavjud." },
              { q: "Qanday turdagi testlar mavjud?", a: "Platformamizda 4 xil test turi mavjud: Lug'at, Grammatika, Reading va Listening. Har biri A1-C1 darajalar uchun tayyorlangan." },
              { q: "Testlar haqiqiy CEFR imtihonlariga o'xshaydimi?", a: "Ha! Testlarimiz rasmiy CEFR imtihonlarining formati va qiyinlik darajasiga mos ravishda tuzilgan." },
              { q: "Natijalarimni kuzatib bora olamanmi?", a: "Albatta! Bepul ro'yxatdan o'ting va barcha test natijalaringizni saqlang." },
              { q: 'Har bir test qancha vaqt oladi?', a: "Har bir test 30 daqiqaga mo'ljallangan — haqiqiy CEFR imtihon bo'limlari kabi." },
            ].map((faq, index) => (
              <FadeUp key={index} delay={index * 0.05}>
                <details className="group card-elevated cursor-pointer p-5">
                  <summary className="flex items-center justify-between font-display font-semibold list-none">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform duration-300" />
                  </summary>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                </details>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-rose-600" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-5 tracking-tight">
              Hoziroq Boshlang
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
              Minglab o'quvchilar bilan birga CEFR sertifikatiga tayyorlaning
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartTest}
              className="inline-flex items-center gap-2.5 bg-white text-secondary font-bold text-base px-8 py-4 rounded-xl hover:bg-white/95 transition-colors shadow-xl"
            >
              {user ? 'Testni Boshlash' : 'Bepul Ro\'yxatdan O\'tish'}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </FadeUp>
        </div>
      </section>
    </div>
  );
};
