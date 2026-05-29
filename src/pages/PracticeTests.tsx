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
      <AppLayout>
        <TestInterface
          level={selectedLevel}
          skill={selectedSkill}
          mockId={selectedMockId}
          testId={selectedTestId || undefined}
          onComplete={handleTestComplete}
          onBack={() => setView('skills')}
        />
      </AppLayout>
    );
  }

  if (view === 'result' && testResult) {
    return (
      <AppLayout>
        <ResultPage
          result={testResult}
          level={selectedLevel || 'A1'}
          onRetake={() => setView('skills')}
          onBack={() => setView('map')}
          onNavigate={(v) => v === 'landing' ? navigate('/') : setView('levels')}
        />
      </AppLayout>
    );
  }

  if (view === 'skills' && selectedLevel) {
    return (
      <AppLayout>
        <SkillSelection
          level={selectedLevel}
          onSelectSkill={handleSkillSelect}
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
