import { 
  LayoutDashboard, Users, FileText, BarChart3, Settings, 
  ChevronLeft, ChevronRight, Shield, MessageSquare, Video, X, ClipboardList, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  isMobile?: boolean;
}

const menuItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'results', label: 'Results & Analytics', icon: BarChart3 },
  { id: 'tests', label: 'Tests Management', icon: FileText },
  { id: 'exams', label: 'Exams', icon: ClipboardList },
  { id: 'payments', label: "To'lovlar", icon: CreditCard },
  { id: 'feedbacks', label: 'Feedbacklar', icon: MessageSquare },
  { id: 'videos', label: 'Video Darslar', icon: Video },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar = ({ 
  activeTab, onTabChange, collapsed, onToggleCollapse, mobileOpen, isMobile
}: AdminSidebarProps) => {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border z-40 transition-all duration-300",
        isMobile 
          ? cn("w-64", mobileOpen ? "translate-x-0" : "-translate-x-full")
          : (collapsed ? "w-16" : "w-64")
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">Admin</span>
          </div>
        )}
        <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-muted transition-colors">
          {isMobile ? <X className="w-5 h-5" /> : (collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
