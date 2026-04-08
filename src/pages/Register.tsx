import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Mail, Lock, User, ArrowRight, Eye, EyeOff,
  AtSign, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(100).optional();
const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: "Username kamida 3 ta belgi bo'lishi kerak" })
  .max(30, { message: "Username 30 ta belgidan oshmasligi kerak" })
  .regex(/^[a-zA-Z0-9_]+$/, { message: "Faqat harf, raqam va _ ishlatish mumkin" });

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');

  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  // Allaqachon login bo'lgan bo'lsa, home ga yo'naltir
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Username mavjudligini tekshirish
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    try {
      usernameSchema.parse(value);
    } catch {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const { data, error } = await supabase.rpc('check_username_available', { p_username: value });
    if (error) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus(data ? 'available' : 'taken');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validatsiya
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (fullName) nameSchema.parse(fullName);
      usernameSchema.parse(username);

      if (usernameStatus === 'taken') {
        setError('Bu username allaqachon band. Boshqasini tanlang.');
        setLoading(false);
        return;
      }
      if (usernameStatus !== 'available') {
        setError('Username mavjudligini tekshiring.');
        setLoading(false);
        return;
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setLoading(false);
        return;
      }
    }

    // Ro'yxatdan o'tish
    try {
      const { error } = await signUp(email, password, fullName, username);
      if (error) {
        setError(
          error.message.includes('already registered')
            ? "Bu email allaqachon ro'yxatdan o'tgan."
            : error.message
        );
      } else {
        // ✅ Muvaffaqiyatli — login sahifasiga yo'naltir (home emas!)
        navigate('/login', {
          state: { message: "Hisob yaratildi! Emailingizni tasdiqlang va keyin kiring." }
        });
      }
    } catch {
      setError('Kutilmagan xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Hisob yaratish" subtitle="Minglab o'quvchilarga qo'shiling">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* To'liq ism */}
        <div>
          <label className="block text-sm font-medium mb-2">To'liq ism</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ismingizni kiriting"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
              }
              placeholder="masalan: ali_123"
              required
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              )}
              {usernameStatus === 'available' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
          </div>
          {usernameStatus === 'taken' && (
            <p className="text-xs text-destructive mt-1">Bu username band. Boshqasini tanlang.</p>
          )}
          {usernameStatus === 'available' && (
            <p className="text-xs text-emerald-500 mt-1">Username bo'sh ✓</p>
          )}
        </div>

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
              type={showPassword ? 'text' : 'password'}
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
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              Ro'yxatdan o'tish
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Login havolasi */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Allaqachon ro'yxatdan o'tganmisiz?
          <Link
            to="/login"
            className="ml-1.5 text-primary font-medium hover:underline"
          >
            Kirish
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
