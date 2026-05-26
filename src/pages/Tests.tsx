import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { LevelSelection } from '@/components/LevelSelection';
import { SkillSelection } from '@/components/SkillSelection';
import { TestInterface } from '@/components/TestInterface';
import { ResultPage } from '@/components/ResultPage';
import { LearningPathMap } from '@/components/LearningPathMap';
import { CEFRLevel, SkillType, ViewType, TestResult } from '@/types/cefr';

type TestView = 'path' | 'levels' | 'skills' | 'test' | 'result';

export default function Tests() {
  const [searchParams] = useSearchParams();
  const initialLevel = searchParams.get('level') as CEFRLevel | null;

  const [view, setView] = useState<TestView>(initialLevel ? 'skills' : 'path');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(initialLevel);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedMockId, setSelectedMockId] = useState<number | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleSelectLevel = useCallback((level: CEFRLevel) => {
    setSelectedLevel(level);
    setView('skills');
  }, []);

  const handleSelectMock = useCallback((skill: SkillType, mockId: number, testId?: string) => {
    setSelectedSkill(skill);
    setSelectedMockId(mockId);
    setSelectedTestId(testId || null);
    setView('test');
  }, []);

  const handleTestFinish = useCallback((result: TestResult) => {
    setTestResult(result);
    setView('result');
  }, []);

  const handleRetry = useCallback(() => {
    setView('test');
    setTestResult(null);
  }, []);

  const handleBackToSkills = useCallback(() => {
    setView('skills');
    setSelectedMockId(null);
    setSelectedTestId(null);
    setTestResult(null);
  }, []);

  // Test va Result uchun AppLayout kerak emas (o'zlari to'liq sahifa)
  if (view === 'test') {
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
  }

  if (view === 'result') {
    return (
      <ResultPage
        result={testResult!}
        onRetry={handleRetry}
        onBack={handleBackToSkills}
      />
    );
  }

  return (
    <AppLayout>
      {view === 'path' && (
        <LearningPathMap
          onSelectLevel={handleSelectLevel}
          onBack={() => setView('path')}
        />
      )}

      {view === 'levels' && (
        <LevelSelection
          onSelectLevel={handleSelectLevel}
          onBack={() => setView('path')}
        />
      )}

      {view === 'skills' && (
        <SkillSelection
          level={selectedLevel!}
          onSelectMock={handleSelectMock}
          onBack={() => setView('path')}
          hideVocabulary
        />
      )}
    </AppLayout>
  );
}
