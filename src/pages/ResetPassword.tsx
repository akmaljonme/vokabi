import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "./Auth";

const ResetPassword = () => {
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Supabase redirect parolni tiklash uchun session o'rnatadi
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery") && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak."); return; }
    if (password !== confirm) { setError("Parollar mos emas."); return; }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) { setError(error.message); return; }
      setDone(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    } catch {
      setError("Kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthLabels = ["", "Juda zaif", "Zaif", "O'rtacha", "Kuchli 💪"];
  const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  if (done) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-card border border-border rounded-3xl p-10 max-w-sm w-full shadow-2xl">
          <motion.div animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
            className="text-7xl mb-6">✅</motion.div>
          <h2 className="text-2xl font-black mb-2">Parol yangilandi!</h2>
          <p className="text-muted-foreground text-sm">Dashboard ga yo'naltirilmoqda...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthLayout title="Yangi parol o'rnating" subtitle="Xavfsiz parol tanlang">
      <form onSubmit={handleSubmit} className="space-y-4 mb-5">
        <div>
          <label className="block text-sm font-medium mb-2">Yangi parol</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showPass ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Kamida 6 ta belgi" required
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : "bg-muted"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strengthLabels[strength]}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Parolni tasdiqlang</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type={showConfirm ? "text" : "password"} value={confirm}
              onChange={e => setConfirm(e.target.value)} placeholder="Parolni qayta kiriting" required
              className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                confirm && confirm !== password ? "border-red-500" : confirm && confirm === password ? "border-green-500" : "border-border"
              }`} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {confirm && confirm === password && (
              <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><span>Parolni yangilash</span><ArrowRight className="w-4 h-4" /></>}
        </motion.button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
