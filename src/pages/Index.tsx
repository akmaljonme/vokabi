import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/components/LandingPage';
import { LevelSelection } from '@/components/LevelSelection';
import { SkillSelection } from '@/components/SkillSelection';
import { TestInterface } from '@/components/TestInterface';
import { ResultPage } from '@/components/ResultPage';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useUserRole } from '@/hooks/useUserRole';
import { CEFRLevel, SkillType, ViewType, TestResult } from '@/types/cefr';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedMockId, setSelectedMockId] = useState<number | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAdmin } = useUserRole();

  const handleNavigate = useCallback((view: ViewType) => {
    setCurrentView(view);
    if (view === 'landing') {
      setSelectedLevel(null);
      setSelectedSkill(null);
      setSelectedMockId(null);
      setSelectedTestId(null);
      setTestResult(null);
    }
  }, []);

  const handleSelectLevel = useCallback((level: CEFRLevel) => {
    setSelectedLevel(level);
    setCurrentView('skills');
  }, []);

  const handleSelectMock = useCallback((skill: SkillType, mockId: number, testId?: string) => {
    setSelectedSkill(skill);
    setSelectedMockId(mockId);
    setSelectedTestId(testId || null);
    setCurrentView('test');
  }, []);

  const handleTestFinish = useCallback((result: TestResult) => {
    setTestResult(result);
    setCurrentView('result');
  }, []);

  const handleRetry = useCallback(() => {
    setCurrentView('test');
    setTestResult(null);
  }, []);

  const handleBackToSkills = useCallback(() => {
    setCurrentView('skills');
    setSelectedMockId(null);
    setSelectedTestId(null);
    setTestResult(null);
  }, []);

  // Show admin dashboard if user is admin and toggled
  if (showAdmin && isAdmin) {
    return <AdminDashboard onExitAdmin={() => setShowAdmin(false)} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return (
          <>
            <Header 
              onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} 
              isAdmin={isAdmin}
              onToggleAdmin={() => setShowAdmin(true)}
            />
            <LandingPage onStartTest={() => setCurrentView('levels')} />
            <Footer />
          </>
        );
      
      case 'levels':
        return (
          <>
            <Header 
              onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} 
              isAdmin={isAdmin}
              onToggleAdmin={() => setShowAdmin(true)}
            />
            <LevelSelection 
              onSelectLevel={handleSelectLevel} 
              onBack={() => handleNavigate('landing')}
            />
            <Footer />
          </>
        );
      
      case 'skills':
        return (
          <>
            <Header 
              onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} 
              isAdmin={isAdmin}
              onToggleAdmin={() => setShowAdmin(true)}
            />
            <SkillSelection 
              level={selectedLevel!}
              onSelectMock={handleSelectMock}
              onBack={() => setCurrentView('levels')}
            />
            <Footer />
          </>
        );
      
      case 'test':
        return (
          <TestInterface
            level={selectedLevel!}
            skill={selectedSkill!}
            mockId={selectedMockId!}
            testId={selectedTestId}
            onFinish={handleTestFinish}
            onBack={handleBackToSkills}
          />
        );
      
      case 'result':
        return (
          <>
            <Header 
              onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} 
              isAdmin={isAdmin}
              onToggleAdmin={() => setShowAdmin(true)}
            />
            <ResultPage
              result={testResult!}
              onRetry={handleRetry}
              onBack={handleBackToSkills}
            />
            <Footer />
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
    </div>
  );
};

export default Index;
