import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Gamepad2, Video, ClipboardList,
  Users, School, Home, PenTool, BookOpen,
  Trophy, Settings, ChevronLeft, ChevronRight,
  Sparkles, Brain, LogOut, Moon, Sun,
  Shield, ChevronDown,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

const mainItems: NavItem[] = [
  { label: "Dashboard",     path: "/dashboard",   icon: LayoutDashboard },
  { label: "O'yinlar",      path: "/games",       icon: Gamepad2 },
  { label: "Video Darslar", path: "/videos",      icon: Video },
  { label: "Examlar",       path: "/exams",       icon: ClipboardList },
  { label: "Hamjamiyat",    path: "/community",   icon: Users },
  { label: "Leaderboard",   path: "/leaderboard", icon: Trophy },
];

const toolItems: NavItem[] = [
  { label: "Test Yechish",  path: "/learning-path", icon: Brain },
  { label: "School",        path: "/school",      icon: School },
  { label: "Study Room",    path: "/study-room",  icon: Home },
  { label: "Essay Checker", path: "/essay",       icon: PenTool },
  { label: "So'z Banki",    path: "/wordbank",    icon: BookOpen },
  { label: "Tools",         path: "/tools",       icon: Sparkles },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [collapsed, setCollapsed] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    try { return document.documentElement.classList.contains("dark"); } catch { return false; }
  });

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const sidebarW = collapsed ? 64 : 220;

  useEffect(() => {
    // Faqat desktop da padding o'rnatamiz
    if (window.innerWidth >= 1024) {
      document.documentElement.style.setProperty("--sidebar-w", `${sidebarW}px`);
      document.documentElement.style.setProperty("--app-content-offset", `${sidebarW}px`);
    } else {
      document.documentElement.style.setProperty("--app-content-offset", "0px");
    }
  }, [sidebarW]);

  const NavBtn = ({ item }: { item: NavItem }) => (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(item.path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
        ${isActive(item.path)
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }`}
    >
      <item.icon className="w-[18px] h-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-popover border border-border rounded-lg text-xs font-medium text-foreground shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
          {item.label}
        </div>
      )}
    </motion.button>
  );

  return (
    <motion.aside
      animate={{ width: sidebarW }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border/50 bg-background/98 backdrop-blur-xl overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-border/30">
        {!collapsed && (
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Vokabi" className="w-8 h-8 rounded-xl shrink-0" />
            <span className="font-display font-bold text-lg">Vokabi</span>
          </button>
        )}
        {collapsed && (
          <button onClick={() => navigate("/dashboard")} className="mx-auto">
            <img src="/logo.svg" alt="Vokabi" className="w-8 h-8 rounded-xl" />
          </button>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="mx-auto mt-1 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 text-muted-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-2">Asosiy</p>}
        {mainItems.map(item => <NavBtn key={item.path} item={item} />)}

        <div className="my-2 mx-1 border-t border-border/30" />

        {/* Tools section */}
        {!collapsed ? (
          <>
            <button onClick={() => setToolsOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest hover:text-muted-foreground transition-colors"
            >
              Vositalar
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {toolsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {toolItems.map(item => <NavBtn key={item.path} item={item} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          toolItems.map(item => <NavBtn key={item.path} item={item} />)
        )}

        {isAdmin && (
          <>
            <div className="my-2 mx-1 border-t border-border/30" />
            <NavBtn item={{ label: "Admin Panel", path: "/admin", icon: Shield }} />
          </>
        )}
      </div>

      {/* Bottom: user + theme */}
      <div className="px-2 pb-3 pt-2 border-t border-border/30 space-y-1">
        <NavBtn item={{ label: "Sozlamalar", path: "/profile", icon: Settings }} />

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          {isDark ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
          {!collapsed && (isDark ? "Light mode" : "Dark mode")}
        </button>

        {/* User card */}
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/30 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
              {(user.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.email?.split("@")[0]}</p>
            </div>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        {collapsed && (
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted/60 transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </motion.aside>
  );
};
