import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sbClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail, Lock, User, ArrowRight, ArrowLeft,
  Eye, EyeOff, AtSign, CheckCircle2, XCircle, Loader2, Check, Gift,
} from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "./Auth";
const supabase: any = _sbClient;

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);
const nameSchema = z.string().trim().min(1).max(100).optional();
const usernameSchema = z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/);

const PURPOSES = [
  { id: "travel",    emoji: "✈️", label: "Sayohat uchun" },
  { id: "work",      emoji: "💼", label: "Ish uchun" },
  { id: "study",     emoji: "🎓", label: "Ta'lim uchun" },
  { id: "exam",      emoji: "📝", label: "Imtihonga tayyorlanish" },
  { id: "hobby",     emoji: "🎯", label: "Qiziqish sifatida" },
  { id: "migration", emoji: "🌍", label: "Chet elga ko'chish" },
];

const LEVELS = [
  { id: "A1", label: "Boshlang'ich", desc: "Hech narsa bilmayman" },
  { id: "A2", label: "Elementar",   desc: "Ozgina bilaman" },
  { id: "B1", label: "O'rta",       desc: "Gaplasha olaman" },
  { id: "B2", label: "O'rta-yuqori",desc: "Yaxshi bilaman" },
  { id: "C1", label: "Ilg'or",      desc: "Deyarli mukammal" },
  { id: "C2", label: "Mukammal",    desc: "Ona tilim kabi" },
];

const GOALS = [
  { id: "ielts",        emoji: "🏆", label: "IELTS 6.0+" },
  { id: "cefr",         emoji: "📜", label: "CEFR Sertifikat" },
  { id: "conversation", emoji: "💬", label: "Erkin suhbat" },
  { id: "business",     emoji: "💼", label: "Biznes til" },
  { id: "kids",         emoji: "🧒", label: "Farzandim uchun" },
  { id: "general",      emoji: "📚", label: "Umumiy o'rganish" },
];

// 3 ta onboarding qadami + 1 ta register forma = 4 qadam
const STEPS = ["Sabab", "Daraja", "Maqsad", "Hisob"];

const Register = () => {
  const { user, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    learning_purpose: "",
    current_level: "",
    learning_goal: "",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const VALID_PROMO = "XCSQW39RTE21";
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) { setUsernameStatus("idle"); return; }
    try { usernameSchema.parse(value); } catch { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    const { data, error } = await supabase.rpc("check_username_available", { p_username: value });
    if (error) { setUsernameStatus("idle"); return; }
    setUsernameStatus(data ? "available" : "taken");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const canNext = () => {
    if (step === 0) return !!prefs.learning_purpose;
    if (step === 1) return !!prefs.current_level;
    if (step === 2) return !!prefs.learning_goal;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (fullName) nameSchema.parse(fullName);
      usernameSchema.parse(username);
      if (usernameStatus === "taken") { setError("Bu username allaqachon band."); setLoading(false); return; }
      if (usernameStatus !== "available") { setError("Username mavjudligini tekshiring."); setLoading(false); return; }
    } catch (err) {
      if (err instanceof z.ZodError) { setError(err.errors[0].message); setLoading(false); return; }
    }

    try {
      const { error: signUpError } = await signUp(email, password, fullName, username);
      if (signUpError) {
        setError(signUpError.message.includes("already registered")
          ? "Bu email allaqachon ro'yxatdan o'tgan."
          : signUpError.message);
        return;
      }

      // Promo kod tekshirish va Pro berish
      if (promoCode.trim().toUpperCase() === VALID_PROMO) {
        try {
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            const promoExpiry = new Date();
            promoExpiry.setMonth(promoExpiry.getMonth() + 1);
            await supabase.from("profiles").update({
              is_pro: true,
              pro_expires_at: promoExpiry.toISOString(),
              promo_code_used: VALID_PROMO,
            }).eq("user_id", newUser.id);
          }
        } catch { /* ignore */ }
      }

      localStorage.setItem("vokabi_prefs", JSON.stringify({
        target_language: "english",
        ...prefs,
        onboarding_done: true,
      }));

      try {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.from("profiles").update({
            target_language: "english",
            learning_purpose: prefs.learning_purpose,
            current_level: prefs.current_level,
            learning_goal: prefs.learning_goal,
            onboarding_done: true,
          }).eq("user_id", newUser.id);
        }
      } catch { /* localStorage fallback */ }

      // Email confirmation kerak bo'lsa shu screen, aks holda dashboard
      setRegisteredEmail(email);
      setRegistered(true);
    } catch {
      setError("Kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  // ── Email tasdiqlash ekrani ───────────────────────────────
  if (registered) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-card border border-border rounded-3xl p-10 shadow-2xl">
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-7xl mb-6"
            >
              📧
            </motion.div>

            <h1 className="text-2xl font-black mb-3">Emailingizni tasdiqlang!</h1>

            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              <span className="font-semibold text-foreground">{registeredEmail}</span> manziliga
              tasdiqlash havolasi yuborildi.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Emailingizni oching va havolaga bosing — keyin platformaga kira olasiz.
            </p>

            {/* Steps */}
            <div className="text-left space-y-3 mb-8 bg-muted/50 rounded-2xl p-4">
              {[
                { n: "1", text: "Emailingizni oching" },
                { n: "2", text: "Vokabi dan kelgan xatni toping" },
                { n: "3", text: "\"Tasdiqlash\" havolasiga bosing" },
                { n: "4", text: "Platformaga kiring va mashq boshlang 🚀" },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-3 text-sm font-semibold">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 font-black">
                    {s.n}
                  </span>
                  {s.text}
                </div>
              ))}
            </div>

            <motion.a
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              href="/login"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mb-3"
            >
              Kirish sahifasiga o'tish
            </motion.a>

            <p className="text-xs text-muted-foreground">
              Email kelmadimi?{" "}
              <button
                onClick={async () => {
                  await supabase.auth.resend({ type: "signup", email: registeredEmail });
                  toast.success("Qayta yuborildi!");
                }}
                className="text-primary hover:underline font-semibold"
              >
                Qayta yuborish
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Onboarding (0–2 qadam) ────────────────────────────────
  if (step < 3) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center p-4 overflow-auto">
        <div className="w-full max-w-lg flex flex-col" style={{ minHeight: "100dvh", paddingBottom: "1rem" }}>

          {/* Header */}
          <div className="text-center pt-8 pb-5 shrink-0">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🇬🇧</span>
            </motion.div>
            <h1 className="text-2xl font-bold mb-1">Ingliz tilini o'rganing!</h1>
            <p className="text-muted-foreground text-sm">Sizga mos dashboard yaratamiz</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-5 shrink-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0
                  ${i < step ? "bg-primary text-primary-foreground" :
                    i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    "bg-muted text-muted-foreground"}`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}
              className="bg-card border border-border rounded-2xl p-5 overflow-y-auto mb-4 flex-1">

              {/* Sabab */}
              {step === 0 && (
                <div>
                  <h2 className="font-semibold text-lg mb-1">Nima uchun ingliz tili o'rganmoqchisiz?</h2>
                  <p className="text-muted-foreground text-sm mb-4">Bu sizga mos kontent ko'rsatishga yordam beradi</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PURPOSES.map(p => (
                      <button key={p.id}
                        onClick={() => setPrefs(pr => ({ ...pr, learning_purpose: p.id }))}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                          ${prefs.learning_purpose === p.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                        <span className="text-xl">{p.emoji}</span>
                        <span className="font-medium text-sm">{p.label}</span>
                        {prefs.learning_purpose === p.id && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Daraja */}
              {step === 1 && (
                <div>
                  <h2 className="font-semibold text-lg mb-1">Hozirgi darajangiz qanday?</h2>
                  <p className="text-muted-foreground text-sm mb-4">Aniq bilmasangiz ham taxminan tanlang</p>
                  <div className="space-y-2">
                    {LEVELS.map(l => (
                      <button key={l.id}
                        onClick={() => setPrefs(p => ({ ...p, current_level: l.id }))}
                        className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left
                          ${prefs.current_level === l.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                          ${prefs.current_level === l.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {l.id}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{l.label}</p>
                          <p className="text-xs text-muted-foreground">{l.desc}</p>
                        </div>
                        {prefs.current_level === l.id && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Maqsad */}
              {step === 2 && (
                <div>
                  <h2 className="font-semibold text-lg mb-1">Asosiy maqsadingiz nima?</h2>
                  <p className="text-muted-foreground text-sm mb-4">Sizga mos mashqlar tavsiya qilamiz</p>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map(g => (
                      <button key={g.id}
                        onClick={() => setPrefs(p => ({ ...p, learning_goal: g.id }))}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                          ${prefs.learning_goal === g.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                        <span className="text-xl">{g.emoji}</span>
                        <span className="font-medium text-sm">{g.label}</span>
                        {prefs.learning_goal === g.id && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 shrink-0">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm">
                <ArrowLeft className="w-4 h-4" /> Orqaga
              </button>
            )}
            <button onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 hover:bg-primary/90 transition-colors">
              Davom etish <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3 shrink-0">
            {step + 1} / 4 — {STEPS[step]}
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2 shrink-0">
            Allaqachon ro'yxatdan o'tganmisiz?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Kirish</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Register forma (4-qadam) ──────────────────────────────
  return (
    <AuthLayout title="Hisob yaratish" subtitle="Minglab o'quvchilarga qo'shiling">

      {/* Google & Apple */}
      <div className="space-y-2 mb-5">
        <div className="relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-muted/30 text-sm font-medium text-muted-foreground cursor-not-allowed select-none">
          <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-50">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="opacity-60">Google bilan ro'yxatdan o'tish</span>
          <span className="absolute right-3 text-[10px] font-semibold bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Tez orada</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">yoki email bilan</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Tanlangan parametrlar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: PURPOSES.find(p => p.id === prefs.learning_purpose)?.label, emoji: PURPOSES.find(p => p.id === prefs.learning_purpose)?.emoji },
          { label: prefs.current_level, emoji: "📊" },
          { label: GOALS.find(g => g.id === prefs.learning_goal)?.label, emoji: GOALS.find(g => g.id === prefs.learning_goal)?.emoji },
        ].map((item, i) => item.label && (
          <span key={i} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
            {item.emoji} {item.label}
          </span>
        ))}
        <button onClick={() => setStep(0)} className="text-xs text-muted-foreground hover:text-foreground underline ml-auto">
          O'zgartirish
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">To'liq ism</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Ismingizni kiriting"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="masalan: ali_123" required
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
              {usernameStatus === "available" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {(usernameStatus === "taken" || usernameStatus === "invalid") && <XCircle className="w-4 h-4 text-destructive" />}
            </div>
          </div>
          {usernameStatus === "taken" && <p className="text-xs text-destructive mt-1">Bu username band.</p>}
          {usernameStatus === "available" && <p className="text-xs text-emerald-500 mt-1">Username bo'sh ✓</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com" required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Parol</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Kamida 6 ta belgi" required
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Promo kod <span className="text-muted-foreground font-normal">(ixtiyoriy)</span>
          </label>
          <div className="relative">
            <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={promoCode}
              onChange={e => {
                const val = e.target.value.toUpperCase();
                setPromoCode(val);
                if (val.length === 0) setPromoStatus("idle");
                else if (val === VALID_PROMO) setPromoStatus("valid");
                else if (val.length >= VALID_PROMO.length) setPromoStatus("invalid");
                else setPromoStatus("idle");
              }}
              placeholder="Promo kodingiz bo'lsa kiriting"
              className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-background text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-all ${
                promoStatus === "valid" ? "border-green-500 focus:ring-green-500/30" :
                promoStatus === "invalid" ? "border-red-500 focus:ring-red-500/30" :
                "border-border focus:ring-primary/50 focus:border-primary"
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {promoStatus === "valid" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {promoStatus === "invalid" && <XCircle className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          {promoStatus === "valid" && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-green-500 font-semibold mt-1.5 flex items-center gap-1">
              🎉 1 oylik Pro obuna bepul aktivlanadi!
            </motion.p>
          )}
          {promoStatus === "invalid" && (
            <p className="text-xs text-red-500 mt-1.5">Noto'g'ri promo kod</p>
          )}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </motion.div>
        )}

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><span>Ro'yxatdan o'tish</span><ArrowRight className="w-4 h-4" /></>}
        </motion.button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-muted-foreground text-sm">
          Allaqachon ro'yxatdan o'tganmisiz?
          <Link to="/login" className="ml-1.5 text-primary font-medium hover:underline">Kirish</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
