import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Bell, Settings,
  GraduationCap, X, Menu, ChevronLeft, ChevronRight,
  BookOpen, BarChart3, Megaphone, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherOverview } from './TeacherOverview';
import { TeacherClassrooms } from './TeacherClassrooms';
import { TeacherAssignments } from './TeacherAssignments';
import { TeacherStudents } from './TeacherStudents';
import { TeacherAnalytics, TeacherAnnouncements, TeacherNotifications } from './TeacherTabsExtra';

interface TeacherDashboardProps {
  onExit: () => void;
}

const menuItems = [
  { id: 'overview',       label: 'Bosh sahifa',   icon: LayoutDashboard },
  { id: 'classrooms',     label: 'Sinflar',        icon: GraduationCap },
  { id: 'students',       label: "O'quvchilar",    icon: Users },
  { id: 'assignments',    label: 'Vazifalar',       icon: ClipboardList },
  { id: 'analytics',      label: 'Statistika',      icon: BarChart3 },
  { id: 'announcements',  label: "E'lonlar",        icon: Megaphone },
  { id: 'notifications',  label: 'Bildirishnomalar',icon: Bell },
];

export const TeacherDashboard = ({ onExit }: TeacherDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isMobile) setMobileOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':      return <TeacherOverview />;
      case 'classrooms':    return <TeacherClassrooms />;
      case 'students':      return <TeacherStudents />;
      case 'assignments':   return <TeacherAssignments />;
      case 'analytics':     return <TeacherAnalytics />;
      case 'announcements': return <TeacherAnnouncements />;
      case 'notifications': return <TeacherNotifications />;
      default:              return <TeacherOverview />;
    }
  };

  const sidebarWidth = isMobile ? 'w-64' : (collapsed ? 'w-16' : 'w-64');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border z-40 transition-all duration-300 flex flex-col",
        sidebarWidth,
        isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : ''
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          {(!collapsed || isMobile) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">O'qituvchi</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Panel</p>
              </div>
            </div>
          )}
          <button
            onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isMobile ? <X className="w-4 h-4" /> : (collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || isMobile) && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + Exit */}
        <div className="p-3 border-t border-border space-y-1 shrink-0">
          {(!collapsed || isMobile) && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'T'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">{profile?.full_name || "O'qituvchi"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="text-sm font-medium">Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        isMobile ? 'ml-0' : (collapsed ? 'ml-16' : 'ml-64')
      )}>
        {/* Top header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-bold text-base md:text-lg">
              {menuItems.find(m => m.id === activeTab)?.label || 'Panel'}
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">
              Vokabi O'qituvchi Platformasi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('notifications')}
              className="relative p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
