import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { OverviewTab } from './OverviewTab';
import { UsersTab } from './UsersTab';
import { ResultsTab } from './ResultsTab';
import { TestsTab } from './TestsTab';
import { FeedbacksTab } from './FeedbacksTab';
import { ExamsTab } from './ExamsTab';
import { PaymentsTab } from './PaymentsTab';
import { SettingsTab } from './SettingsTab';
import { VideoLessonsTab } from './VideoLessonsTab';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

export const AdminDashboard = ({ onExitAdmin }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'users': return <UsersTab />;
      case 'results': return <ResultsTab />;
      case 'tests': return <TestsTab />;
      case 'exams': return <ExamsTab />;
      case 'payments': return <PaymentsTab />;
      case 'feedbacks': return <FeedbacksTab />;
      case 'videos': return <VideoLessonsTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isMobile) setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <AdminSidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggleCollapse={() => {
          if (isMobile) setMobileSidebarOpen(false);
          else setSidebarCollapsed(!sidebarCollapsed);
        }}
        mobileOpen={mobileSidebarOpen}
        isMobile={isMobile}
      />
      <AdminHeader 
        sidebarCollapsed={isMobile ? true : sidebarCollapsed}
        onExitAdmin={onExitAdmin}
        onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        isMobile={isMobile}
      />
      
      <main 
        className={cn(
          "pt-16 transition-all duration-300",
          isMobile ? "ml-0" : (sidebarCollapsed ? "ml-16" : "ml-64")
        )}
      >
        <div className="p-3 sm:p-6 overflow-x-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
