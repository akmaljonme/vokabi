import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  School, Users, BarChart3, BookOpen, CheckCircle2,
  ArrowRight, Star, Building2, GraduationCap, ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = [
  {
    name: "Starter",
    price: "199,000",
    period: "so'm/oy",
    students: "30 gacha o'quvchi",
    teachers: "3 gacha o'qituvchi",
    color: "border-border",
    badge: null,
    features: [
      "Sinf boshqaruvi",
      "Test ulashish",
      "Asosiy analytics",
      "Email qo'llab-quvvatlash",
    ],
  },
  {
    name: "Pro",
    price: "499,000",
    period: "so'm/oy",
    students: "100 gacha o'quvchi",
    teachers: "10 gacha o'qituvchi",
    color: "border-primary",
    badge: "Eng mashhur",
    features: [
      "Sinf boshqaruvi",
      "AI Writing & Speaking baholash",
      "Kengaytirilgan analytics",
      "Vazifa berish tizimi",
      "Telegram xabarnomalar",
      "Priority qo'llab-quvvatlash",
    ],
  },
  {
    name: "Academy",
    price: "999,000",
    period: "so'm/oy",
    students: "Cheksiz o'quvchi",
    teachers: "Cheksiz o'qituvchi",
    color: "border-border",
    badge: null,
    features: [
      "Pro dagi hamma narsa",
      "Maxsus brending",
      "API integratsiya",
      "Shaxsiy menejer",
      "Onlayn o'quv jadvali",
      "Sertifikat generatsiya",
    ],
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Sinf boshqaruvi",
    desc: "O'quvchilarni sinflarga bo'ling, har bir sinfga o'qituvchi tayinlang va real vaqtda progress kuzating.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Kengaytirilgan analytics",
    desc: "Har bir o'quvchining kuchli va zaif tomonlarini ko'ring. Sinf bo'yicha taqqoslama hisobotlar.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: BookOpen,
    title: "Vazifa berish",
    desc: "O'qituvchilar test, essay va o'yinlarni vazifa sifatida beradi. AI avtomatik baholaydi.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: GraduationCap,
    title: "Sertifikatlar",
    desc: "O'quvchilar CEFR darajasini olganda avtomatik sertifikat generatsiya qilinadi.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Star,
    title: "AI baholash",
    desc: "Writing va Speaking testlarini AI IELTS standartida baholaydi. O'qituvchiga vaqt tejaladi.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Building2,
    title: "Ko'p filial",
    desc: "Bir nechta filiallarni bitta admin paneldan boshqaring. Har filialga alohida o'qituvchilar.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const FAQ = [
  {
    q: "Sinab ko'rish imkoni bormi?",
    a: "Ha! 14 kunlik bepul sinov davri bor. Kredit karta talab qilinmaydi.",
  },
  {
    q: "O'quvchilar qanday qo'shiladi?",
    a: "Admin sinf uchun invite kod yaratadi. O'quvchilar shu kod orqali ro'yxatdan o'tadi va darhol sinfga qo'shiladi.",
  },
  {
    q: "To'lov qanday amalga oshiriladi?",
    a: "Payme, Click yoki bank o'tkazmasi orqali. Oylik yoki yillik to'lov (yillikda 2 oy bepul).",
  },
  {
    q: "Ma'lumotlarimiz xavfsizmi?",
    a: "Ha, barcha ma'lumotlar shifrlangan holda Supabase da saqlanadi. GDPR talablariga mos.",
  },
  {
    q: "Nechta foydalanuvchi bir vaqtda ishlashi mumkin?",
    a: "Cheklov yo'q. Barcha o'quvchilar bir vaqtda platformadan foydalanishi mumkin.",
  },
];

export default function ForSchools() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-black text-primary-foreground text-sm">V</div>
            <span className="font-black text-base">Vokabi</span>
            <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-muted">B2B</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground font-medium hidden sm:block">Narxlar</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground font-medium hidden sm:block">FAQ</a>
            {user ? (
              <button onClick={() => navigate("/school/admin")} className="btn-primary text-sm px-4 py-2">
                Admin panel
              </button>
            ) : (
              <button onClick={() => navigate("/register")} className="btn-primary text-sm px-4 py-2">
                Bepul boshlash
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Building2 className="w-4 h-4" /> O'quv markazlar va maktablar uchun
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-6 tracking-tight leading-tight">
              O'quvchilaringizni<br/>
              <span className="text-primary">AI bilan o'qiting</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Vokabi B2B — ingliz tili kurslaringizni raqamlashtiring. AI baholash, sinf boshqaruvi,
              real vaqt analytics — barchasi bitta platformada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/school/admin")}
                className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base font-bold">
                14 kun bepul sinab ko'ring <ArrowRight className="w-5 h-5" />
              </motion.button>
              <a href="#pricing"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-border hover:border-primary/40 font-semibold transition-all text-base">
                Narxlarni ko'rish
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Kredit karta talab qilinmaydi • 14 kun bepul</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-20">
            {[
              { n: "500+", l: "O'quv markaz" },
              { n: "10,000+", l: "O'quvchi" },
              { n: "AI", l: "Avtomatik baholash" },
              { n: "24/7", l: "Qo'llab-quvvatlash" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="text-center p-5 rounded-2xl bg-card border border-border">
                <p className="text-2xl font-black text-primary mb-1">{s.n}</p>
                <p className="text-xs text-muted-foreground font-semibold">{s.l}</p>
              </motion.div>
            ))}
          </div>

          {/* Features */}
          <div className="mb-20">
            <h2 className="text-3xl font-display font-black text-center mb-3">Nima uchun Vokabi B2B?</h2>
            <p className="text-center text-muted-foreground mb-10">O'qituvchilarga vaqt, o'quvchilarga natija</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="mb-20 bg-muted/30 rounded-3xl p-8 lg:p-12">
            <h2 className="text-3xl font-display font-black text-center mb-10">Qanday boshlash mumkin?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { n: "1", title: "Ro'yxatdan o'ting", desc: "Admin akkaunt yarating va maktabingizni qo'shing. 2 daqiqa.", emoji: "📋" },
                { n: "2", title: "Sinf yarating", desc: "O'qituvchilarni qo'shing, sinflar yarating va invite kod yuboring.", emoji: "🏫" },
                { n: "3", title: "O'qitishni boshlang", desc: "O'quvchilar vazifalarni bajaradi, AI baholaydi, siz nazorat qilasiz.", emoji: "🚀" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl mb-3">{s.emoji}</div>
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center mx-auto mb-3">{s.n}</div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div id="pricing" className="mb-20">
            <h2 className="text-3xl font-display font-black text-center mb-3">Narxlar</h2>
            <p className="text-center text-muted-foreground mb-10">Hamma rejada 14 kun bepul sinov</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {PLANS.map((plan, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`relative p-6 rounded-2xl border-2 bg-card ${plan.color} ${plan.badge ? "shadow-lg shadow-primary/10" : ""}`}>
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="font-black text-lg mb-1">{plan.name}</h3>
                  <p className="text-3xl font-black mb-0.5">{plan.price}</p>
                  <p className="text-xs text-muted-foreground mb-2">{plan.period}</p>
                  <p className="text-sm font-semibold text-primary mb-4">{plan.students} • {plan.teachers}</p>
                  <div className="space-y-2 mb-6">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate("/school/admin")}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.badge ? "btn-primary" : "border-2 border-border hover:border-primary/40 hover:bg-muted"}`}>
                    Boshlash
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div id="faq" className="mb-20">
            <h2 className="text-3xl font-display font-black text-center mb-10">Ko'p beriladigan savollar</h2>
            <div className="max-w-2xl mx-auto space-y-3">
              {FAQ.map((item, i) => (
                <div key={i} className="border border-border rounded-2xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold hover:bg-muted/30 transition-colors">
                    {item.q}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-primary/5 border border-primary/20 rounded-3xl p-12">
            <h2 className="text-3xl font-black mb-3">Bugun boshlang!</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              14 kun bepul. Kredit karta kerak emas. Istalgan vaqt bekor qilish mumkin.
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/school/admin")}
              className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-base font-bold">
              Bepul boshlash <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Vokabi. Barcha huquqlar himoyalangan.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/" className="hover:text-foreground transition-colors">Asosiy sahifa</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Narxlar</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        </div>
      </footer>
    </div>
  );
}
