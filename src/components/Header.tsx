import { useState, useEffect } from "react";
import {
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Moon,
  Sun,
  Sparkles,
  Gamepad2,
  Users,
  MessageCircle,
  Phone,
  Video,
  ClipboardList,
  BookOpen,
  PenTool,
  Home,
  LayoutDashboard,
  UserPlus,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUnreadDMCount } from "@/hooks/useUnreadDMCount";
import { FeedLogo } from "@/components/dashboard/DashboardIllustrations";
import { useCall } from "@/contexts/CallContext";
import { Badge } from "@/components/ui/badge";
import { supabase as _sbClient } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
const supabase: any = _sbClient;

interface HeaderProps {
  onNavigate: (view: "landing" | "levels") => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export const Header = ({ onNavigate, isAdmin, onToggleAdmin }: HeaderProps) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadDMCount();
  const call = useCall();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotifUnread(count || 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (supabase.from("profiles") as any)
      .select("username, full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data)
          setDisplayName(
            data.username ? `@${data.username}` : data.full_name || user.email,
          );
      });
  }, [user]);

  // Drawer ochiq bo'lganda body scroll ni bloklash
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate("landing");
  };

  return (
    <>
    <header
      className="sticky top-0 z-50 border-b border-border/50"
      style={{
        background: "hsl(var(--background) / 0.8)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate("landing")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">
              ​Vokabi
            </span>
          </motion.div>

          {/* Desktop Navigation — chapga yopishgan */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-4 flex-1">
            <div
              className="relative"
              onMouseEnter={() => setIsPracticeOpen(true)}
              onMouseLeave={() => setIsPracticeOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm">
                {t("header.practiceTests")}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPracticeOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isPracticeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-52 bg-card rounded-xl shadow-xl border border-border p-1.5 z-50"
                  >
                    {["A1", "A2", "B1", "B2", "C1"].map((level) => (
                      <button key={level} onClick={() => { try { navigate("/practice"); } catch { onNavigate("levels"); } }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                      >
                        {level} {t("header.levelTests")}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user && (
              <>
                <button onClick={() => navigate("/dashboard")}
                  className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm"
                >{t("nav.dashboard")}</button>
                <button onClick={() => navigate("/games")}
                  className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm flex items-center gap-1.5"
                ><Gamepad2 className="w-3.5 h-3.5" /> {t("nav.games")}</button>
                <button onClick={() => navigate("/community")}
                  className="relative px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> {t("nav.community")}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </button>

                {/* More dropdown */}
                <div className="relative" onMouseEnter={() => setIsMoreOpen(true)} onMouseLeave={() => setIsMoreOpen(false)}>
                  <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm">
                    {t("header.more")} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isMoreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-52 bg-card rounded-xl shadow-xl border border-border p-1.5 z-50"
                      >
                        {[
                          { label: t("nav.videoLessons"), icon: "🎬", path: "/videos" },
                          { label: t("nav.exams"), icon: "📋", path: "/exams" },
                          { label: t("header.practiceTests"), icon: "📝", path: "/learning-path" },
                          { label: t("header.school"), icon: "🏫", path: "/school" },
                          { label: t("nav2.studyRoom"), icon: "🏠", path: "/study-room" },
                          { label: t("nav2.essayChecker"), icon: "✍️", path: "/essay" },
                          { label: t("nav.wordBank"), icon: "📚", path: "/wordbank" },
                          { label: t("nav.grammar"), icon: "📖", path: "/grammar" },
                          { label: t("nav.listening"), icon: "🎧", path: "/listening" },
                          { label: t("nav.tools"), icon: "⚡", path: "/tools" },
                        ].map(item => (
                          <button key={item.path} onClick={() => navigate(item.path)}
                            className="w-full px-3 py-2 text-left rounded-lg hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2.5"
                          >
                            <span>{item.icon}</span> {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            <button onClick={() => navigate("/pricing")}
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm"
            >{t("nav.pricing")}</button>
            <button onClick={() => navigate("/blog")}
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm"
            >{t("header.blog")}</button>
            <button onClick={() => navigate("/for-schools")}
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm"
            >{t("header.b2b")}</button>
            <a href="#faq"
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium text-sm"
            >{t("header.faq")}</a>
          </nav>

          {/* Auth Button */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-muted transition-colors"
              title={t("header.toggleTheme")}
            >
              {isDark ? (
                <Sun className="w-[18px] h-[18px]" />
              ) : (
                <Moon className="w-[18px] h-[18px]" />
              )}
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
                    {t("header.admin")}
                  </motion.button>
                )}
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate max-w-28">
                    {displayName || user.email}
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
                onClick={() => navigate("/login")}
                className="btn-primary text-sm px-5 py-2.5"
              >
                {t("header.getStarted")}
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-1">
            {user && (
              <>
                {/* Mobile Feed shortcut */}
                <button
                  onClick={() => navigate("/feed")}
                  className="p-1.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <FeedLogo className="w-6 h-6" />
                </button>
                {/* Mobile DM badge */}
                <button
                  onClick={() => navigate("/community")}
                  className="relative p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {/* Mobile call indicator */}
                {(call.callState === "ringing" ||
                  call.callState === "calling" ||
                  call.callState === "connected") && (
                  <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
                    <Phone className="w-5 h-5 text-green-500 animate-pulse" />
                  </button>
                )}
              </>
            )}
            {!user && (
              <button
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Mobile Drawer — header TASHQARISIDA, fixed full screen */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-[9998] lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 h-full w-[280px] bg-background border-r border-border/50 z-[9999] lg:hidden flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-display font-bold text-lg">Vokabi</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User info */}
              {user && (
                <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-sm">
                    {(displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{displayName || user.email}</p>
                    <p className="text-xs text-muted-foreground">{t("header.user")}</p>
                  </div>
                </div>
              )}

              {/* Nav items — scrollable */}
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">

                {/* Login qilmagan foydalanuvchi uchun */}
                {!user && (
                  <button onClick={() => { navigate("/practice"); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium text-left"
                  >📝 {t("header.practiceTests")}</button>
                )}

                {/* Asosiy navigatsiya — Home/Learn/Games/Rank/Profile pastki panelda,
                    shu yerda faqat o'sha panelda yo'q, qo'shimcha bo'limlar */}
                {user && (
                  <>
                    <button onClick={() => { navigate("/feed"); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                    ><FeedLogo className="w-5 h-5" /> {t("nav.feed")}</button>
                    <button onClick={() => { navigate("/reels"); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                    ><Video className="w-4 h-4 text-rose-500" /> {t("nav.reels")}</button>
                    <button onClick={() => { navigate("/community"); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                    >
                      <Users className="w-4 h-4 text-blue-500" /> {t("nav.community")}
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </button>
                    <button onClick={() => { navigate("/friends"); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                    ><UserPlus className="w-4 h-4 text-primary" /> {t("nav.friends")}</button>
                    <button onClick={() => { navigate("/notifications"); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                    >
                      <Bell className="w-4 h-4 text-amber-500" /> {t("nav.notifications")}
                      {notifUnread > 0 && (
                        <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5">
                          {notifUnread > 99 ? "99+" : notifUnread}
                        </Badge>
                      )}
                    </button>
                    <button onClick={() => { navigate("/tournaments"); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                    ><span className="text-base">⚔️</span> {t("nav.tournaments")}</button>
                  </>
                )}

                <button onClick={() => { navigate("/pricing"); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                ><span className="text-base">💎</span> {t("nav.pricing")}</button>

                {/* Vositalar accordion */}
                {user && (
                  <>
                    <div className="pt-2 pb-1">
                      <button
                        onClick={() => setIsMoreOpen(o => !o)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-semibold text-muted-foreground"
                      >
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t("nav.tools")}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {isMoreOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-0.5 pl-2"
                        >
                          {[
                            { label: t("nav.articles"), emoji: "📖", path: "/articles" },
                            { label: t("nav.videoLessons"), emoji: "🎬", path: "/videos" },
                            { label: t("nav.exams"), emoji: "📋", path: "/exams" },
                            { label: t("header.languages"), emoji: "🌍", path: "/languages" },
                            { label: t("header.school"), emoji: "🏫", path: "/school" },
                            { label: t("nav2.studyRoom"), emoji: "🏠", path: "/study-room" },
                            { label: t("nav2.essayChecker"), emoji: "✍️", path: "/essay" },
                            { label: t("nav.wordBank"), emoji: "📚", path: "/wordbank" },
                            { label: t("nav.grammar"), emoji: "📖", path: "/grammar" },
                            { label: t("nav.listening"), emoji: "🎧", path: "/listening" },
                            { label: t("nav.tools"), emoji: "⚡", path: "/tools" },
                          ].map(item => (
                            <button key={item.path}
                              onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-sm"
                            >
                              <span className="text-base w-5 text-center">{item.emoji}</span> {item.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* Bottom actions */}
              <div className="px-3 pb-4 pt-2 border-t border-border/40 space-y-1">
                <button onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                >
                  {isDark ? <><Sun className="w-4 h-4 text-amber-400" /> {t("header.lightMode")}</> : <><Moon className="w-4 h-4" /> {t("header.darkMode")}</>}
                </button>

                {user && (
                  <button onClick={() => { navigate("/profile"); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                  ><Settings className="w-4 h-4 text-muted-foreground" /> {t("nav.settings")}</button>
                )}

                <a href="/#faq" onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                ><HelpCircle className="w-4 h-4 text-muted-foreground" /> {t("header.help")}</a>

                {isAdmin && onToggleAdmin && (
                  <button onClick={() => { onToggleAdmin(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors text-sm font-medium"
                  ><Shield className="w-4 h-4" /> {t("header.adminPanel")}</button>
                )}

                {user ? (
                  <button onClick={handleSignOut}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/40 text-destructive font-bold text-sm tracking-wide hover:bg-destructive/10 transition-colors"
                  ><LogOut className="w-4 h-4" /> {t("header.logoutCaps")}</button>
                ) : (
                  <button onClick={() => { navigate("/login"); setIsMenuOpen(false); }}
                    className="w-full btn-primary py-2.5 text-sm"
                  >{t("nav.login")}</button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
