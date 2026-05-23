import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Gamepad2, Video, ClipboardList,
  Users, School, Home, PenTool, BookOpen, Zap,
  Trophy, Settings, ChevronLeft, ChevronRight,
  Sparkles, BarChart3, Star, GraduationCap
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  emoji?: string;
  badge?: string;
}

const mainItems: NavItem[] = [
  { label: "Dashboard",     path: "/dashboard",    icon: LayoutDashboard, emoji: "📊" },
  { label: "O'yinlar",      path: "/games",        icon: Gamepad2,        emoji: "🎮" },
  { label: "Video Darslar", path: "/videos",       icon: Video,           emoji: "🎬" },
  { label: "Examlar",       path: "/exams",        icon: ClipboardList,   emoji: "📋" },
  { label: "Hamjamiyat",    path: "/community",    icon: Users,           emoji: "👥" },
  { label: "Leaderboard",   path: "/leaderboard",  icon: Trophy,          emoji: "🏆" },
];

const toolItems: NavItem[] = [
  { label: "School",         path: "/school",       icon: School,        emoji: "🏫" },
  { label: "Study Room",     path: "/study-room",   icon: Home,          emoji: "🏠" },
  { label: "Essay Checker",  path: "/essay",        icon: PenTool,       emoji: "✍️" },
  { label: "So'z Banki",     path: "/wordbank",     icon: BookOpen,      emoji: "📚" },
  { label: "Tools",          path: "/tools",        icon: Sparkles,      emoji: "⚡" },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavBtn = ({ item }: { item: NavItem }) => (
    <motion.button
      whileHover={{ x: collapsed ? 0 : 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(item.path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
        ${isActive(item.path)
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }`}
    >
      <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive(item.path) ? "" : "group-hover:scale-110 transition-transform"}`} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="truncate overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {collapsed && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-popover border border-border rounded-lg text-xs font-medium text-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
          {item.label}
        </div>
      )}
    </motion.button>
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-[72px] bottom-0 z-40 flex flex-col border-r border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      {/* Collapse toggle */}
      <div className="flex justify-end p-2 border-b border-border/30">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {/* Main */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">Asosiy</p>
        )}
        {mainItems.map(item => <NavBtn key={item.path} item={item} />)}

        <div className="my-3 mx-2 border-t border-border/30" />

        {/* Tools */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">Vositalar</p>
        )}
        {toolItems.map(item => <NavBtn key={item.path} item={item} />)}
      </div>

      {/* Bottom: Settings */}
      <div className="p-2 border-t border-border/30">
        <NavBtn item={{ label: "Sozlamalar", path: "/profile", icon: Settings }} />
      </div>
    </motion.aside>
  );
};
