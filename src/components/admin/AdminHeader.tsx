import { Bell, Search, Moon, Sun, ArrowLeft, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface AdminHeaderProps {
  sidebarCollapsed: boolean;
  onExitAdmin: () => void;
  onMenuToggle?: () => void;
  isMobile?: boolean;
}

export const AdminHeader = ({ sidebarCollapsed, onExitAdmin, onMenuToggle, isMobile }: AdminHeaderProps) => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  return (
    <header 
      className="h-16 bg-card border-b border-border fixed top-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6"
      style={{ left: isMobile ? 0 : (sidebarCollapsed ? '64px' : '256px') }}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {isMobile && (
          <button onClick={onMenuToggle} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onExitAdmin}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Exit Admin</span>
        </button>
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users, tests..." className="pl-10 w-64 bg-muted/50 border-0" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border">
          <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user?.email?.split('@')[0]}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
