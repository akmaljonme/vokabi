import { useState } from 'react';
import { ChevronDown, Menu, X, LogOut, User, Shield, Moon, Sun, Sparkles, Gamepad2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnreadDMCount } from '@/hooks/useUnreadDMCount';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onNavigate: (view: 'landing' | 'levels') => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export const Header = ({ onNavigate, isAdmin, onToggleAdmin }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadDMCount();

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('landing');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50" style={{
      background: 'hsl(var(--background) / 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate('landing')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">
              IELTSify
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <div
              className="relative"
              onMouseEnter={() => setIsPracticeOpen(true)}
              onMouseLeave={() => setIsPracticeOpen(false)}
            >
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm">
                Practice Tests
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPracticeOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isPracticeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-52 bg-card rounded-xl shadow-xl border border-border p-1.5"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1'].map((level) => (
                      <button
                        key={level}
                        onClick={() => onNavigate('levels')}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                      >
                        {level} Level Tests
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user && (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/games')}
                  className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm flex items-center gap-1.5"
                >
                  <Gamepad2 className="w-3.5 h-3.5" /> O'yinlar
                </button>
                <button
                  onClick={() => navigate('/community')}
                  className="relative px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> Hamjamiyat
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </button>
              </>
            )}
            <a href="#pricing" className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm">
              Pricing
            </a>
            <a href="#faq" className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm">
              FAQ
            </a>
          </nav>

          {/* Auth Button */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-muted transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && onToggleAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onToggleAdmin}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors text-sm font-medium"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </motion.button>
                )}
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate max-w-28">
                    {user.email}
                  </span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/auth')}
                className="btn-primary text-sm px-5 py-2.5"
              >
                Boshlash
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-border/50"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              <button
                onClick={() => { onNavigate('levels'); setIsMenuOpen(false); }}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-muted transition-colors font-medium text-sm"
              >
                Practice Tests
              </button>
              {user && (
                <>
                  <button onClick={() => { navigate('/games'); setIsMenuOpen(false); }} className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-muted transition-colors font-medium text-sm">
                    <Gamepad2 className="w-4 h-4" /> O'yinlar
                  </button>
                  <button onClick={() => { navigate('/community'); setIsMenuOpen(false); }} className="relative flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-muted transition-colors font-medium text-sm">
                    <Users className="w-4 h-4" /> Hamjamiyat
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </button>
                </>
              )}
              <a href="#pricing" className="py-2.5 px-3 rounded-xl hover:bg-muted transition-colors font-medium text-sm">Pricing</a>
              <a href="#faq" className="py-2.5 px-3 rounded-xl hover:bg-muted transition-colors font-medium text-sm">FAQ</a>

              <button onClick={toggleTheme} className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-muted transition-colors text-sm">
                {isDark ? <><Sun className="w-4 h-4" /> Light Mode</> : <><Moon className="w-4 h-4" /> Dark Mode</>}
              </button>

              <div className="h-px bg-border my-2" />

              {user ? (
                <>
                  <button onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-muted transition-colors">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm">{user.email}</span>
                  </button>
                  <button onClick={handleSignOut} className="btn-outline w-full flex items-center justify-center gap-2 mt-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => navigate('/auth')} className="btn-primary w-full mt-2">
                  Boshlash
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
