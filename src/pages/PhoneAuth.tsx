import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, Send, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase: any = _sb;
import AuthLayout from "./Auth";

type Stage = "phone" | "not_linked" | "code";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

const PhoneAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      const pendingClass = sessionStorage.getItem("pending_class_code");
      const pendingTeacher = sessionStorage.getItem("pending_teacher_code");
      if (pendingClass) navigate(`/school/student?class=${pendingClass}`, { replace: true });
      else if (pendingTeacher) navigate(`/school/teacher?code=${pendingTeacher}`, { replace: true });
      else navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cls = params.get("class");
    const teacher = params.get("teacher-code");
    const ref = params.get("ref");
    if (cls) sessionStorage.setItem("pending_class_code", cls.toUpperCase());
    if (teacher) sessionStorage.setItem("pending_teacher_code", teacher.toUpperCase());
    if (ref) sessionStorage.setItem("pending_referral_code", ref.toUpperCase());
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const formatPhoneDisplay = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 12);
    let out = "";
    if (digits.length > 0) out += "+" + digits.slice(0, 3);
    if (digits.length > 3) out += " " + digits.slice(3, 5);
    if (digits.length > 5) out += " " + digits.slice(5, 8);
    if (digits.length > 8) out += " " + digits.slice(8, 10);
    if (digits.length > 10) out += " " + digits.slice(10, 12);
    return out;
  };

  const rawDigits = phone.replace(/\D/g, "");

  const sendCode = async () => {
    setError("");
    if (rawDigits.length < 9) {
      setError("To'liq telefon raqam kiriting");
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone: rawDigits },
      });
      if (fnError || data?.error) {
        const errCode = data?.error || fnError?.message;
        if (errCode === "telegram_not_linked") {
          setStage("not_linked");
        } else {
          setError(data?.message || "Kod yuborilmadi. Qayta urinib ko'ring.");
        }
        return;
      }
      setStage("code");
      setCode(Array(OTP_LENGTH).fill(""));
      setResendIn(RESEND_SECONDS);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error(err);
      setError("Server bilan bog'lanishda xato yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < OTP_LENGTH - 1) codeRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === OTP_LENGTH) {
      verifyCode(next.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (fullCode: string) => {
    setError("");
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-phone-otp", {
        body: { phone: rawDigits, code: fullCode },
      });
      if (fnError || data?.error) {
        setError(data?.error || "Kod noto'g'ri yoki muddati o'tgan");
        setCode(Array(OTP_LENGTH).fill(""));
        codeRefs.current[0]?.focus();
        return;
      }
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token_hash,
        type: "magiclink",
      });
      if (verifyErr) {
        setError("Kirishda xato yuz berdi, qayta urinib ko'ring");
        return;
      }
      // navigate ishlaydi — user useEffect orqali avtomatik yo'naltiriladi
    } catch (err) {
      console.error(err);
      setError("Server bilan bog'lanishda xato yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={stage === "code" ? "Kodni kiriting" : "Xush kelibsiz!"}
      subtitle={
        stage === "phone"
          ? "Telefon raqamingiz orqali kiring — kod Telegram botga yuboriladi"
          : stage === "not_linked"
            ? "Avval Telegram botga ulanish kerak"
            : `${formatPhoneDisplay(phone)} raqamiga Telegram orqali kod yuborildi`
      }
    >
      <AnimatePresence mode="wait">
        {stage === "phone" && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-5"
          >
            <div>
              <label className="text-sm font-medium mb-1.5 block">Telefon raqam</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formatPhoneDisplay(phone)}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              onClick={sendCode}
              disabled={loading || rawDigits.length < 9}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Kod yuborish
            </button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Davom etish orqali siz Vokabi{" "}
              <a href="/#faq" className="text-primary hover:underline">
                foydalanish shartlariga
              </a>{" "}
              rozilik bildirasiz
            </p>
          </motion.div>
        )}

        {stage === "not_linked" && (
          <motion.div
            key="not_linked"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-5"
          >
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <p className="text-sm leading-relaxed">
                Bu raqam hali Telegram botimizga ulanmagan. Kirish kodlarini olish uchun avval:
              </p>
              <ol className="text-sm space-y-1.5 text-muted-foreground list-decimal list-inside">
                <li>
                  Telegram'da <strong className="text-foreground">@vokabi_bot</strong> ni oching
                </li>
                <li>
                  <strong className="text-foreground">/start</strong> tugmasini bosing
                </li>
                <li>"📱 Raqamni ulash" tugmasi orqali raqamingizni ulashing</li>
              </ol>
            </div>

            <a
              href="https://t.me/vokabi_bot?start=link"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> @vokabi_bot'ni ochish
            </a>

            <button
              onClick={() => {
                setStage("phone");
                setError("");
              }}
              className="w-full btn-outline py-3 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Raqamni ulashdim, qayta urinish
            </button>
          </motion.div>
        )}

        {stage === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-center gap-2.5">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (codeRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  disabled={loading}
                  className="w-14 h-16 text-center text-2xl font-bold rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                />
              ))}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Tekshirilmoqda...
              </div>
            )}

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" /> Kod Telegram orqali yuborildi, hech kim bilan baham ko'rmang
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={() => {
                  setStage("phone");
                  setError("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Raqamni o'zgartirish
              </button>
              <span className="text-border">•</span>
              <button
                onClick={sendCode}
                disabled={resendIn > 0 || loading}
                className="text-primary font-medium disabled:opacity-50 disabled:text-muted-foreground"
              >
                {resendIn > 0 ? `Qayta yuborish (${resendIn}s)` : "Kodni qayta yuborish"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default PhoneAuth;
