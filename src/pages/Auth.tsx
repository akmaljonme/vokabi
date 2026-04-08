import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, AtSign, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { motion } from 'framer-motion';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(100).optional();
const usernameSchema = z.string().trim().min(3, { message: "Username kamida 3 ta belgi bo'lishi kerak" }).max(30, { message: "Username 30 ta belgidan oshmasligi kerak" }).regex(/^[a-zA-Z0-9_]+$/, { message: "Faqat harf, raqam va _ ishlatish mumkin" });

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

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
    if (isLogin) return;
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, isLogin, checkUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLogin) {
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
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message.includes('Invalid login') ? 'Noto\'g\'ri email yoki parol.' : error.message);
        }
      } else {
        const { error } = await signUp(email, password, fullName, username);
        if (error) {
          setError(error.message.includes('already registered') ? 'Bu email allaqachon ro\'yxatdan o\'tgan.' : error.message);
        } else {
          setSuccess('Hisob yaratildi! Emailingizni tasdiqlang va keyin kiring.');
          setIsLogin(true);
        }
      }
    } catch {
      setError('Kutilmagan xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <header className="relative z-10 py-5">
        <div className="container mx-auto px-4">
          <a href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">​Vokabi</span>
          </a>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="card-elevated p-8 md:p-10 border border-border/50">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display font-bold mb-2 tracking-tight">
                {isLogin ? 'Xush kelibsiz!' : 'Hisob yaratish'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isLogin
                  ? 'Natijalaringizni saqlash uchun kiring'
                  : "Minglab o'quvchilarga qo'shiling"}
              </p>
            </div>
            {/* Form content here */}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;