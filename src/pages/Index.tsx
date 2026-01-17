import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/components/LandingPage';
import { LevelSelection } from '@/components/LevelSelection';
import { SkillSelection } from '@/components/SkillSelection';
import { TestInterface } from '@/components/TestInterface';
import { ResultPage } from '@/components/ResultPage';
import { CEFRLevel, SkillType, ViewType, TestResult } from '@/types/cefr';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedMockId, setSelectedMockId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleNavigate = useCallback((view: ViewType) => {
    setCurrentView(view);
    if (view === 'landing') {
      setSelectedLevel(null);
      setSelectedSkill(null);
      setSelectedMockId(null);
      setTestResult(null);
    }
  }, []);

  const handleSelectLevel = useCallback((level: CEFRLevel) => {
    setSelectedLevel(level);
    setCurrentView('skills');
  }, []);

  const handleSelectMock = useCallback((skill: SkillType, mockId: number) => {
    setSelectedSkill(skill);
    setSelectedMockId(mockId);
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
    setTestResult(null);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return (
          <>
            <Header onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} />
            <LandingPage onStartTest={() => setCurrentView('levels')} />
            <Footer />
          </>
        );
      
      case 'levels':
        return (
          <>
            <Header onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} />
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
            <Header onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} />
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
            onFinish={handleTestFinish}
            onBack={handleBackToSkills}
          />
        );
      
      case 'result':
        return (
          <>
            <Header onNavigate={(view) => handleNavigate(view === 'levels' ? 'levels' : 'landing')} />
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
