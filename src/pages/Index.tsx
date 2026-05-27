import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/components/LandingPage';
import { LevelSelection } from '@/components/LevelSelection';
import { SkillSelection } from '@/components/SkillSelection';
import { TestInterface } from '@/components/TestInterface';
import { ResultPage } from '@/components/ResultPage';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { LearningPathMap } from '@/components/LearningPathMap';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { CEFRLevel, SkillType, ViewType, TestResult } from '@/types/cefr';

const Index = () => {
  const { user, loading } = useAuth();

  // Auth yuklanayotganda bo'sh ekran ko'rsat
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (user) return <Navigate to="/dashboard" replace />;

  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedMockId, setSelectedMockId] = useState<number | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [searchParams] = useSearchParams();

  // URL parametrlardan daraja va autostart
  useEffect(() => {
    const level = searchParams.get('level') as CEFRLevel | null;
    const autostart = searchParams.get('autostart');
    if (level) {
      setSelectedLevel(level);
      if (autostart === 'true') {
        setCurrentView('skills');
      } else {
        setCurrentView('levels');
      }
    }
  }, []);
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
    if (selectedSkill === 'vocabulary') {
      setCurrentView('vocabulary');
    } else {
      setCurrentView('skills');
    }
    setSelectedMockId(null);
    setSelectedTestId(null);
    setTestResult(null);
  }, [selectedSkill]);

  const handleGoToVocabulary = useCallback(() => {
    setCurrentView('vocabulary');
  }, []);

  // Show admin dashboard if user is admin and toggled
  if (showAdmin && isAdmin) {
    return <AdminDashboard onExitAdmin={() => setShowAdmin(false)} />;
  }

  const headerProps = {
    onNavigate: (view: string) => handleNavigate(view === 'levels' ? 'levels' : 'landing'),
    isAdmin,
    onToggleAdmin: () => setShowAdmin(true),
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return (
          <>
            <Header {...headerProps} />
            <LandingPage onStartTest={() => setCurrentView('path')} onGoToVocabulary={handleGoToVocabulary} />
            <Footer />
          </>
        );
      
      case 'path':
        return (
          <>
            <Header {...headerProps} />
            <LearningPathMap 
              onSelectLevel={handleSelectLevel}
              onBack={() => handleNavigate('landing')}
            />
            <Footer />
          </>
        );
      
      case 'levels':
        return (
          <>
            <Header {...headerProps} />
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
            <Header {...headerProps} />
            <SkillSelection 
              level={selectedLevel!}
              onSelectMock={handleSelectMock}
              onBack={() => setCurrentView('levels')}
              hideVocabulary
            />
            <Footer />
          </>
        );

      case 'vocabulary':
        return (
          <>
            <Header {...headerProps} />
            <SkillSelection
              level={'A1'}
              onSelectMock={handleSelectMock}
              onBack={() => handleNavigate('landing')}
              vocabularyOnly
            />
            <Footer />
          </>
        );
      
      case 'test':
        return (
          <TestInterface
            level={selectedLevel || 'A1'}
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
            <Header {...headerProps} />
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
