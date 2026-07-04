import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { LevelSelection } from '@/components/LevelSelection';
import { SkillSelection } from '@/components/SkillSelection';
import { TestInterface } from '@/components/TestInterface';
import { ResultPage } from '@/components/ResultPage';
import { LearningPathMap } from '@/components/LearningPathMap';
import type { CEFRLevel, SkillType, ViewType, TestResult } from '@/types/cefr';

type View = 'map' | 'levels' | 'skills' | 'test' | 'result';

export default function PracticeTests() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>('map');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [selectedMockId, setSelectedMockId] = useState<number | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const level = searchParams.get('level') as CEFRLevel | null;
    const autostart = searchParams.get('autostart');
    const urlTestId = searchParams.get('testId');
    const urlSkill = searchParams.get('skill') as SkillType | null;

    if (urlTestId && urlSkill) {
      // Mock test'dan to'g'ridan-to'g'ri ochiladi
      setSelectedLevel((level as CEFRLevel) || 'B1');
      setSelectedSkill(urlSkill);
      setSelectedTestId(urlTestId);
      setSelectedMockId(1);
      setView('test');
      return;
    }

    if (level) {
      setSelectedLevel(level);
      setView(autostart === 'true' ? 'skills' : 'levels');
    }
  }, []);

  const handleLevelSelect = (level: CEFRLevel) => {
    setSelectedLevel(level);
    setView('skills');
  };

  const handleSkillSelect = (skill: SkillType, mockId: number, testId?: string) => {
    setSelectedSkill(skill);
    setSelectedMockId(mockId);
    setSelectedTestId(testId || null);
    setView('test');
  };

  const handleTestComplete = (result: TestResult) => {
    setTestResult(result);
    setView('result');
  };

  if (view === 'test' && selectedLevel && selectedSkill && selectedMockId) {
    return (
      <TestInterface
        level={selectedLevel}
        skill={selectedSkill}
        mockId={selectedMockId}
        testId={selectedTestId || undefined}
        onFinish={handleTestComplete}
        onBack={() => setView('skills')}
      />
    );
  }

  if (view === 'result' && testResult) {
    return (
      <ResultPage
        result={testResult}
        onRetry={() => setView('skills')}
        onBack={() => setView('map')}
      />
    );
  }

  if (view === 'skills' && selectedLevel) {
    return (
      <AppLayout>
        <SkillSelection
          level={selectedLevel}
          onSelectMock={handleSkillSelect}
          onBack={() => setView('levels')}
        />
      </AppLayout>
    );
  }

  if (view === 'levels') {
    return (
      <AppLayout>
        <LevelSelection
          onSelectLevel={handleLevelSelect}
          onBack={() => setView('map')}
        />
      </AppLayout>
    );
  }

  // Default: map view
  return (
    <AppLayout>
      <LearningPathMap
        onSelectLevel={handleLevelSelect}
        onBack={() => navigate('/dashboard')}
      />
    </AppLayout>
  );
}
