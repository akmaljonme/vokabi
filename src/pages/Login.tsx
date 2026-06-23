import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Phone } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import AuthLayout from "./Auth";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (err instanceof z.ZodError) { setError(err.errors[0].message); setLoading(false); return; }
    }
    try {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message || "";
        if (msg.includes("Invalid login credentials")) setError("Email yoki parol noto'g'ri.");
        else if (msg.includes("Email not confirmed")) setError("Emailingizni tasdiqlang — pochta qutingizni tekshiring.");
        else setError(msg || "Kirish muvaffaqiyatsiz.");
      } else {
        // Apply pending promo code if any
        const pendingPromo = localStorage.getItem("pending_promo");
        if (pendingPromo === "XCSQW39RTE21") {
          try {
            const { data: { user: loggedUser } } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
            if (loggedUser) {
              const promoExpiry = new Date();
              promoExpiry.setMonth(promoExpiry.getMonth() + 1);
              const sb = (await import("@/integrations/supabase/client")).supabase as any;
              await sb.from("profiles").update({
                is_pro: true,
                pro_expires_at: promoExpiry.toISOString(),
                promo_code_used: pendingPromo,
              }).eq("user_id", loggedUser.id);
              localStorage.removeItem("pending_promo");
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setError("Kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Xush kelibsiz!" subtitle="Natijalaringizni saqlash uchun kiring">

      <form onSubmit={handleSubmit} className="space-y-4 mb-5">
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Parol</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              Parolni unutdim?
            </Link>
          </div>
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
            : <><span>Kirish</span><ArrowRight className="w-4 h-4" /></>}
        </motion.button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-muted-foreground text-sm">
          Hisobingiz yo'qmi?
          <Link to="/register" className="ml-1.5 text-primary font-medium hover:underline">Ro'yxatdan o'tish</Link>
        </p>
      </div>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">yoki</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google - Soon */}
      <div className="relative mb-3">
        <div className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-muted/30 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60 select-none">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google bilan kirish
        </div>
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Tez kunda</span>
      </div>

      {/* Phone - Soon */}
      <div className="relative">
        <div className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-muted/30 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60 select-none">
          <Phone className="w-5 h-5" />
          Telefon bilan kirish
        </div>
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Tez kunda</span>
      </div>

    </AuthLayout>
  );
};

export default Login;
