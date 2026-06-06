import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Phone, MessageCircle } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import AuthLayout from "./Auth";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255);
const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(72);

const Login = () => {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { user, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setLoading(false);
        return;
      }
    }

    try {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message || "";
        if (msg.includes("Email not confirmed")) {
          setError("Emailingiz tasdiqlanmagan. Email orqali kelgan tasdiq xabarini oching.");
        } else if (msg.includes("Invalid login")) {
          setError("Noto'g'ri email yoki parol.");
        } else {
          setError(msg);
        }
      }
      // signIn muvaffaqiyatli bo'lsa, useEffect orqali '/' ga yo'naltiriladi
    } catch {
      setError("Kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) setError(result.error.message || "Google bilan kirishda xatolik");
  };

  const normalizePhone = (p: string) => "+" + p.replace(/\D/g, "");

  const sendOtp = async () => {
    setError("");
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) { setError("To'liq telefon raqam kiriting"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", { body: { phone: normalized } });
      if (error || (data as any)?.error) {
        const msg = (data as any)?.message || (data as any)?.error || error?.message;
        if ((data as any)?.error === "telegram_not_linked") {
          setError("Avval @vokabi_bot ga kiring, /start bosing va raqamingizni ulashing. Keyin qayta urinib ko'ring.");
        } else {
          setError(msg || "Kod yuborilmadi");
        }
        return;
      }
      setOtpSent(true);
      toast.success("Kod Telegram (@vokabi_bot) orqali yuborildi");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setError("");
    if (otpCode.length !== 4) { setError("4 xonali kodni kiriting"); return; }
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const { data, error } = await supabase.functions.invoke("verify-phone-otp", { body: { phone: normalized, code: otpCode } });
      if (error || (data as any)?.error) { setError((data as any)?.error || error?.message || "Kod xato"); return; }
      const { token_hash, email } = data as any;
      const { error: vErr } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink" } as any);
      if (vErr) { setError(vErr.message); return; }
      toast.success("Xush kelibsiz!");
      navigate("/dashboard", { replace: true });
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      title="Xush kelibsiz!"
      subtitle="Natijalaringizni saqlash uchun kiring"
    >
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted mb-5">
        <button
          type="button"
          onClick={() => { setMode("email"); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === "email" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
        >
          <Mail className="w-4 h-4 inline mr-1.5" />Email
        </button>
        <button
          type="button"
          onClick={() => { setMode("phone"); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${mode === "phone" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
        >
          <Phone className="w-4 h-4 inline mr-1.5" />Telefon
        </button>
      </div>

      {mode === "email" ? (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Parol */}
        <div>
          <label className="block text-sm font-medium mb-2">Parol</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kamida 6 ta belgi"
              required
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Xato */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20"
          >
            {error}
          </motion.div>
        )}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Kirish
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Telefon raqam</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                disabled={otpSent}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-60"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              4 xonali kod <a href="https://t.me/vokabi_bot" target="_blank" className="text-primary font-medium underline">@vokabi_bot</a> Telegram botingizga yuboriladi
            </p>
          </div>

          {otpSent && (
            <div>
              <label className="block text-sm font-medium mb-2">Tasdiq kodi</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • •"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>
          )}

          {!otpSent ? (
            <button type="button" onClick={sendOtp} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Kod yuborish <ArrowRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <div className="space-y-2">
              <button type="button" onClick={verifyOtp} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Tasdiqlash"}
              </button>
              <button type="button" onClick={() => { setOtpSent(false); setOtpCode(""); setError(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground py-2">
                Raqamni o'zgartirish
              </button>
            </div>
          )}
        </div>
      )}

      {/* Register havolasi */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Hisobingiz yo'qmi?
          <Link to="/register" className="ml-1.5 text-primary font-medium hover:underline">
            Ro'yxatdan o'tish
          </Link>
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">yoki</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* OAuth buttons */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-background hover:bg-muted/50 text-sm font-medium transition"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google bilan kirish
      </button>
    </AuthLayout>
  );
};

export default Login;
