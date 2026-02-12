import { ArrowRight, BookOpen, Headphones, Award, Users, CheckCircle2, Star, ChevronDown, Zap, Globe, TrendingUp, Shield } from 'lucide-react';
import { levels } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onStartTest: () => void;
  onGoToVocabulary?: () => void;
}

export const LandingPage = ({ onStartTest, onGoToVocabulary }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartTest = () => {
    if (user) {
      onStartTest();
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/50">
        {/* Background Elements */}
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-level-a2/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-slide-up">
                <Star className="w-4 h-4 fill-primary" />
                <span className="font-medium text-sm">5+ foydalanuvchi ishonchini qozongan</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Ingliz Tilini Mukammal
                <br />
                <span className="text-gradient">O'rganing va Sinang</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Lug'at, grammatika, reading va listening testlari bilan bilimingizni sinang. 
                Natijalaringizni kuzating va CEFR sertifikatingizga tayyorlaning.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={handleStartTest}
                  className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                   {user ? 'Testni Boshlash' : 'Bepul Test Boshlash'}
                   <ArrowRight className="w-5 h-5" />
                </button>
                {onGoToVocabulary && (
                  <button
                    onClick={() => user ? onGoToVocabulary() : navigate('/auth')}
                    className="btn-outline flex items-center gap-2 text-lg px-8 py-4"
                  >
                    📚 Lug'at Testlari
                  </button>
                )}
              </div>

              <div className="flex items-center gap-6 mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-level-a1" />
                   <span className="text-muted-foreground">Kredit karta shart emas</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-level-a1" />
                   <span className="text-muted-foreground">Tezkor natijalar</span>
                </div>
              </div>
            </div>

            {/* Right Content - Stats Cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
              { icon: BookOpen, value: '500+', label: 'Testlar', color: 'from-emerald-400 to-teal-500' },
              { icon: Users, value: '50K+', label: 'Foydalanuvchilar', color: 'from-blue-400 to-indigo-500' },
              { icon: Award, value: '95%', label: "Muvaffaqiyat", color: 'from-amber-400 to-orange-500' },
              { icon: Globe, value: '4', label: 'Test Turi', color: 'from-primary to-red-600' }].
              map((stat, index) =>
              <div
                key={index}
                className="card-elevated p-6 animate-slide-up"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}>

                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-display font-bold mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </a>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-8">Xalqaro til standartlariga mos</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            {['IELTS', 'TOEFL', 'Cambridge', 'Goethe', 'DELF'].map((brand) =>
            <div key={brand} className="text-2xl font-display font-bold text-muted-foreground/50">
                {brand}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
           <div className="text-center mb-16">
             <span className="inline-block text-primary font-semibold mb-4">IMKONIYATLAR</span>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
               Muvaffaqiyat Uchun <span className="text-gradient">Barcha Kerakli</span> Vositalar
             </h2>
             <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
               Ingliz tilini o'rganish va CEFR sertifikatiga tayyorgarlik ko'rish uchun to'liq vositalar
             </p>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[
            {
              icon: BookOpen,
              title: "Lug'at Testlari",
              description: "So'z boyligingizni sinab ko'ring. Har bir daraja uchun maxsus tayyorlangan so'z testlari bilan leksik bilimingizni oshiring.",
              color: 'bg-emerald-500'
            },
            {
              icon: Zap,
              title: 'Grammatika Testlari',
              description: "Grammatik qoidalarni mustahkamlang. Gap tuzilishi, fe'l zamonlari va boshqa mavzular bo'yicha testlar.",
              color: 'bg-purple-500'
            },
            {
              icon: BookOpen,
              title: 'Reading Testlari',
              description: "Haqiqiy CEFR formatidagi o'qish testlari. Matnlarni tahlil qilish va tushunish qobiliyatingizni sinang.",
              color: 'bg-blue-500'
            },
            {
              icon: Headphones,
              title: 'Listening Testlari',
              description: "Audio materiallar bilan tinglash qobiliyatingizni rivojlantiring. Real hayotiy vaziyatlarga asoslangan testlar.",
              color: 'bg-amber-500'
            },
            {
              icon: TrendingUp,
              title: "Natijalar Tahlili",
              description: "Har bir test bo'yicha batafsil natijalar va kamchiliklaringizni aniqlash imkoniyati.",
              color: 'bg-pink-500'
            },
            {
              icon: Shield,
              title: 'Ekspert Kontent',
              description: "Barcha testlar sertifikatlangan CEFR o'qituvchilari tomonidan tayyorlangan.",
              color: 'bg-primary'
            }].
            map((feature, index) =>
            <div key={index} className="card-elevated group p-8">
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section id="levels" className="py-20 lg:py-32 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
           <div className="text-center mb-16">
             <span className="inline-block text-primary font-semibold mb-4">CEFR DARAJALAR</span>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
               O'z <span className="text-gradient">Darajangizni</span> Tanlang
             </h2>
             <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
               Boshlang'ichdan ilg'orgacha — har bir daraja uchun maxsus testlar mavjud
             </p>
           </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {levels.map((level, index) => {
              const colors: Record<string, string> = {
                A1: 'from-emerald-400 to-emerald-600',
                A2: 'from-teal-400 to-teal-600',
                B1: 'from-amber-400 to-amber-600',
                B2: 'from-orange-400 to-orange-600',
                C1: 'from-red-400 to-red-600'
              };

              return (
                <button
                  key={level.level}
                  onClick={handleStartTest}
                  className="level-card text-center group"
                  style={{ animationDelay: `${index * 0.1}s` }}>

                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[level.level]} text-white text-2xl font-display font-bold mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    {level.level}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{level.name}</h3>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </button>);

            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <span className="inline-block text-primary font-semibold mb-4">QANDAY ISHLAYDI</span>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
               Uchta Oddiy <span className="text-gradient">Qadam</span>
             </h2>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
            {
              step: '01',
              title: 'Darajangizni Tanlang',
              description: "A1 dan C1 gacha o'z darajangizga mos testni tanlang",
              icon: '🎯'
            },
            {
              step: '02',
              title: 'Testni Yeching',
              description: "Lug'at, grammatika, reading yoki listening testini yeching",
              icon: '📝'
            },
            {
              step: '03',
              title: "Natijani Ko'ring",
              description: "Natijalaringizni tahlil qiling va kamchiliklaringiz ustida ishlang",
              icon: '📈'
            }].
            map((item, index) =>
            <div key={index} className="relative text-center p-8">
                <div className="text-6xl mb-4">{item.icon}</div>
                <div className="text-sm text-primary font-bold mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-display font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                
                {index < 2 &&
              <ArrowRight className="hidden md:block absolute top-12 -right-4 w-8 h-8 text-primary/30" />
              }
              </div>
            )}
          </div>

          <div className="text-center mt-12">
             <button
              onClick={handleStartTest}
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">

               Hozir Boshlang
               <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <span className="inline-block text-primary font-semibold mb-4">IZOHLAR</span>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
               Foydalanuvchilar <span className="text-primary">Fikrlari</span>
             </h2>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
            {
              name: 'Aziza Karimova',
              level: 'B2 Sertifikat',
              text: "Lug'at va grammatika testlari juda foydali bo'ldi. 3 oyda B2 imtihoniga to'liq tayyorlandim!",
              avatar: 'AK'
            },
            {
              name: 'Sardor Rahimov',
              level: 'C1 Sertifikat',
              text: "Tezkor natijalar va batafsil tushuntirishlar xatolarimni tushunishni osonlashtirdi. Juda tavsiya qilaman!",
              avatar: 'SR'
            },
            {
              name: 'Malika Usmanova',
              level: 'B1 Sertifikat',
              text: "Istalgan vaqtda, istalgan joyda mashq qilish mumkin. Mobil qurilmalar uchun qulay interfeys juda yoqdi.",
              avatar: 'MU'
            }].
            map((testimonial, index) =>
            <div key={index} className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-red-600 flex items-center justify-center font-semibold text-lg text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{testimonial.name}</div>
                    <div className="text-sm text-secondary-foreground/70">{testimonial.level}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) =>
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                )}
                </div>
                <p className="text-secondary-foreground/80 leading-relaxed">{testimonial.text}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <span className="inline-block text-primary font-semibold mb-4">SAVOL-JAVOB</span>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
               Ko'p Beriladigan <span className="text-gradient">Savollar</span>
             </h2>
           </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
            {
              q: 'CEFR nima?',
              a: "CEFR (Common European Framework of Reference for Languages) — tillarni bilish darajasini belgilovchi xalqaro standart. A1 dan C2 gacha 6 ta daraja mavjud."
            },
            {
              q: "Qanday turdagi testlar mavjud?",
              a: "Platformamizda 4 xil test turi mavjud: Lug'at, Grammatika, Reading va Listening. Har bir test turi A1-C1 darajalar uchun tayyorlangan."
            },
            {
              q: "Testlar haqiqiy CEFR imtihonlariga o'xshaydimi?",
              a: "Ha! Testlarimiz rasmiy CEFR imtihonlarining formati va qiyinlik darajasiga mos ravishda tuzilgan."
            },
            {
              q: "Natijalarimni kuzatib bora olamanmi?",
              a: "Albatta! Bepul ro'yxatdan o'ting va barcha test natijalaringizni saqlang hamda rivojlanishingizni kuzating."
            },
            {
              q: 'Har bir test qancha vaqt oladi?',
              a: "Har bir test 30 daqiqaga mo'ljallangan — haqiqiy CEFR imtihon bo'limlari kabi."
            }].
            map((faq, index) =>
            <details key={index} className="group card-elevated cursor-pointer p-6">
                <summary className="flex items-center justify-between font-semibold text-lg list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-primary group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary to-red-600">
        <div className="container mx-auto px-4 text-center">
           <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
             Sayohatingizni Boshlashga Tayyormisiz?
           </h2>
           <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
             Minglab o'rganuvchilar qatoriga qo'shiling va ingliz tili bilimingizni yangi darajaga olib chiqing.
           </p>
           <button
            onClick={handleStartTest}
            className="bg-white text-primary px-10 py-5 rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors inline-flex items-center gap-3 shadow-lg">

             Bepul Testni Boshlang
             <ArrowRight className="w-6 h-6" />
           </button>
        </div>
      </section>
    </div>);

};