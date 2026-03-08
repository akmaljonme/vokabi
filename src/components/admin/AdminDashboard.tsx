import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { OverviewTab } from './OverviewTab';
import { UsersTab } from './UsersTab';
import { ResultsTab } from './ResultsTab';
import { TestsTab } from './TestsTab';

import { SettingsTab } from './SettingsTab';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

export const AdminDashboard = ({ onExitAdmin }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'users':
        return <UsersTab />;
      case 'results':
        return <ResultsTab />;
      case 'tests':
        return <TestsTab />;
      case 'exams':
        return <ExamsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <AdminHeader 
        sidebarCollapsed={sidebarCollapsed} 
        onExitAdmin={onExitAdmin}
      />
      
      <main 
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
