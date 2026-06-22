import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "./Auth";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
          setError("Juda ko'p urinish. Iltimos, 1 daqiqa kuting va qayta urining.");
        } else {
          setError(error.message);
        }
        return;
      }
      setSent(true);
    } catch {
      setError("Kutilmagan xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-3xl p-10 shadow-2xl">
            <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 1.2, delay: 0.3 }} className="text-7xl mb-6">📬</motion.div>
            <h1 className="text-2xl font-black mb-3">Emailingizni tekshiring!</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              <span className="font-semibold text-foreground">{email}</span> manziliga
              parolni tiklash havolasi yuborildi.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Havola 1 soat davomida amal qiladi.
            </p>
            <div className="text-left space-y-3 mb-8 bg-muted/50 rounded-2xl p-4">
              {[
                "Emailingizni oching",
                "Vokabi dan kelgan xatni toping",
                "\"Parolni tiklash\" havolasiga bosing",
                "Yangi parol o'rnating",
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-semibold">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 font-black">{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mb-3">
              Kirish sahifasiga qaytish
            </Link>
            <button onClick={() => { setSent(false); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Qayta yuborish
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthLayout title="Parolni tiklash" subtitle="Emailingizga tiklash havolasi yuboramiz">
      <form onSubmit={handleSubmit} className="space-y-4 mb-5">
        <div>
          <label className="block text-sm font-medium mb-2">Email manzilingiz</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com" required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
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
            : <><span>Havola yuborish</span><ArrowRight className="w-4 h-4" /></>}
        </motion.button>
      </form>

      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kirish sahifasiga qaytish
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
