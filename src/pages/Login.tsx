import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import AuthLayout from "./Auth";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, signIn, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
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
        setError(
          error.message.includes("Invalid login")
            ? "Noto'g'ri email yoki parol."
            : error.message,
        );
      }
      // signIn muvaffaqiyatli bo'lsa, useEffect orqali '/' ga yo'naltiriladi
    } catch {
      setError("Kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Xush kelibsiz!"
      subtitle="Natijalaringizni saqlash uchun kiring"
    >
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
      <div className="space-y-3">
        <div className="relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-muted/30 text-sm font-medium text-muted-foreground cursor-not-allowed select-none">
          <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-50">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="opacity-60">Google bilan kirish</span>
          <span className="absolute right-3 text-[10px] font-semibold bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Tez orada</span>
        </div>

        <div className="relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-muted/30 text-sm font-medium text-muted-foreground cursor-not-allowed select-none">
          <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-50" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.41c1.31.07 2.22.77 3 .82.92-.17 1.8-.9 2.81-.78 1.23.14 2.17.66 2.76 1.65-2.52 1.54-1.93 5.04.69 6.05-.47 1.22-1.07 2.42-1.26 5.13zM12.03 7.35c-.16-2.55 1.85-4.68 4.26-4.85.31 2.67-2.01 4.97-4.26 4.85z"/>
          </svg>
          <span className="opacity-60">Apple bilan kirish</span>
          <span className="absolute right-3 text-[10px] font-semibold bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Tez orada</span>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
